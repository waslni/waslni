const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { success: false, message: 'Method not allowed' });

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return json(503, { success: false, message: 'إعداد Telegram غير مكتمل على الخادم.' });

  const authorization = request.headers.get('Authorization');
  const apiKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization || !apiKey) return json(401, { success: false, message: 'يلزم تسجيل الدخول.' });
  const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: authorization }
  });
  if (!userResponse.ok) return json(401, { success: false, message: 'جلسة الدخول غير صالحة.' });
  const authUser = await userResponse.json();

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { success: false, message: 'طلب غير صالح.' }); }

  try {
    if (body.action === 'message') {
      if (body.type === 'receipt') return json(400, { success: false, message: 'استخدم مسار الإيصال المخصص.' });
      const text = String(body.text || '').slice(0, 3500);
      if (!text) return json(400, { success: false, message: 'الرسالة فارغة.' });
      const sent = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      });
      const result = await sent.json();
      return sent.ok && result.ok ? json(200, { success: true }) : json(502, { success: false, message: 'تعذر إرسال تنبيه Telegram.' });
    }

    if (body.action === 'receipt') {
      const orderNumber = String(body.orderNumber || '').slice(0, 40);
      if (!orderNumber || !authUser?.id) return json(400, { success: false, message: 'رقم الطلب غير صالح.' });
      const orderResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=order_number,status`,
        { headers: { apikey: apiKey, Authorization: authorization } }
      );
      const visibleOrders = orderResponse.ok ? await orderResponse.json() : [];
      if (!Array.isArray(visibleOrders) || visibleOrders.length !== 1) {
        return json(403, { success: false, message: 'لا تملك صلاحية الوصول إلى هذا الطلب.' });
      }
      if (visibleOrders[0].status !== 'pending_payment') {
        return json(409, { success: false, message: 'لا يمكن إرفاق إيصال لهذا الطلب بعد تحديث حالته.' });
      }
      const image = String(body.image || '');
      const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match || match[2].length > 7_000_000) return json(400, { success: false, message: 'الصورة غير صالحة أو تتجاوز الحد المسموح.' });
      const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', `إيصال الطلب ${orderNumber}\nالعميل: ${String(body.customerName || '').slice(0, 100)}`);
      form.append('photo', new Blob([bytes], { type: match[1] }), 'receipt');
      const sent = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form });
      const result = await sent.json();
      return sent.ok && result.ok ? json(200, { success: true }) : json(502, { success: false, message: 'تعذر إرسال الإيصال إلى Telegram.' });
    }
    return json(400, { success: false, message: 'نوع الإشعار غير مدعوم.' });
  } catch {
    return json(502, { success: false, message: 'تعذر الاتصال بخدمة Telegram.' });
  }
});
