import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function reply(status: number, data: Record<string, unknown>) {
  return Response.json(data, { status, headers: corsHeaders });
}

function serverKey() {
  const key = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (key) return key;
  const keyMap = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!keyMap) return '';
  try {
    const parsed = JSON.parse(keyMap);
    return typeof parsed === 'string' ? parsed : parsed.default || Object.values(parsed).find(value => typeof value === 'string') || '';
  } catch { return ''; }
}

function publishableKey() {
  return Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendAdminMessage(text: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const result = await response.json().catch(() => ({}));
  return response.ok && result.ok === true;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return reply(405, { success: false, message: 'الطريقة غير مدعومة.' });

  const url = Deno.env.get('SUPABASE_URL');
  const secret = serverKey();
  const publicKey = publishableKey();
  const authorization = request.headers.get('Authorization');
  if (!url || !secret || !publicKey) return reply(503, { success: false, message: 'إعدادات الخادم غير مكتملة.' });
  if (!authorization) return reply(401, { success: false, message: 'سجّل الدخول أولاً.' });

  const userClient = createClient(url, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return reply(401, { success: false, message: 'انتهت جلسة الدخول.' });
    const { data: manager } = await admin.from('profiles')
      .select('id, full_name, role, is_active').eq('id', authData.user.id).maybeSingle();
    if (!manager || manager.role !== 'manager' || !manager.is_active) {
      return reply(403, { success: false, message: 'تأكيد حذف الطلب متاح للمدير العام فقط.' });
    }

    const body = await request.json();
    const orderNumber = String(body.orderNumber || '').trim().slice(0, 40);
    const action = body.deleteAction === 'hard_delete' ? 'hard_delete' : 'cancel';
    if (!orderNumber) return reply(400, { success: false, message: 'رقم الطلب غير صالح.' });

    if (body.action === 'request_code') {
      const { data: order } = await admin.from('orders').select('order_number, customer_name, amount')
        .eq('order_number', orderNumber).maybeSingle();
      if (!order) return reply(404, { success: false, message: 'الطلب غير موجود.' });
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
      const codeHash = await sha256(`${manager.id}:${orderNumber}:${action}:${code}`);
      await admin.from('order_deletion_challenges').delete()
        .eq('manager_id', manager.id).eq('order_number', orderNumber).eq('action', action);
      const { error: insertError } = await admin.from('order_deletion_challenges').insert({
        manager_id: manager.id, order_number: orderNumber, action, code_hash: codeHash
      });
      if (insertError) return reply(500, { success: false, message: 'تعذر إنشاء رمز التأكيد.' });
      const label = action === 'hard_delete' ? 'الحذف النهائي' : 'إلغاء الطلب';
      const sent = await sendAdminMessage(`رمز تأكيد ${label} لطلب ${orderNumber}: ${code}\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`);
      if (!sent) {
        await admin.from('order_deletion_challenges').delete()
          .eq('manager_id', manager.id).eq('order_number', orderNumber).eq('action', action);
        return reply(503, { success: false, message: 'تعذر إرسال الرمز إلى Telegram؛ لم يبدأ الحذف.' });
      }
      return reply(200, { success: true, message: `أرسلنا رمز تأكيد ${label} الطلب ${orderNumber} إلى Telegram. صلاحية الرمز 5 دقائق.` });
    }

    if (body.action !== 'confirm_code') return reply(400, { success: false, message: 'العملية غير معروفة.' });
    const code = String(body.code || '').trim();
    if (!/^\d{6}$/.test(code)) return reply(400, { success: false, message: 'أدخل رمز التأكيد المكون من 6 أرقام.' });
    const { data: challenge } = await admin.from('order_deletion_challenges').select('*')
      .eq('manager_id', manager.id).eq('order_number', orderNumber).eq('action', action)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!challenge || Date.parse(challenge.expires_at) <= Date.now() || challenge.failed_attempts >= 3) {
      return reply(410, { success: false, message: 'انتهت صلاحية الرمز أو لم يتم طلبه. اطلب رمزًا جديدًا.' });
    }
    const expected = await sha256(`${manager.id}:${orderNumber}:${action}:${code}`);
    if (expected !== challenge.code_hash) {
      const attempts = challenge.failed_attempts + 1;
      await admin.from('order_deletion_challenges').update({ failed_attempts: attempts }).eq('id', challenge.id);
      return reply(400, { success: false, message: attempts >= 3 ? 'تجاوزت عدد المحاولات. اطلب رمزًا جديدًا.' : 'رمز التأكيد غير صحيح.' });
    }
    const { data: currentOrder } = await admin.from('orders').select('order_number')
      .eq('order_number', orderNumber).maybeSingle();
    if (!currentOrder) return reply(404, { success: false, message: 'الطلب غير موجود أو تم حذفه مسبقًا.' });
    const { data: consumed } = await admin.from('order_deletion_challenges').delete()
      .eq('id', challenge.id).select('id').maybeSingle();
    if (!consumed) return reply(409, { success: false, message: 'استُخدم الرمز مسبقًا. اطلب رمزًا جديدًا.' });

    if (action === 'hard_delete') {
      const { error } = await admin.from('orders').delete().eq('order_number', orderNumber);
      if (error) return reply(500, { success: false, message: 'تعذر حذف الطلب من قاعدة البيانات.' });
    } else {
      const { error } = await admin.from('orders').update({
        status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: manager.full_name || manager.id
      }).eq('order_number', orderNumber);
      if (error) return reply(500, { success: false, message: 'تعذر إلغاء الطلب في قاعدة البيانات.' });
    }
    const label = action === 'hard_delete' ? 'حذف نهائي' : 'إلغاء';
    const notificationSent = await sendAdminMessage(`تم ${label} الطلب ${orderNumber} بواسطة المدير ${manager.full_name || manager.id}.`);
    return reply(200, {
      success: true,
      message: `تم ${label} الطلب ${orderNumber} وتحديث قاعدة البيانات.${notificationSent ? '' : ' تعذر إرسال إشعار الإتمام إلى Telegram.'}`
    });
  } catch {
    return reply(500, { success: false, message: 'حدث خطأ أثناء تأكيد العملية.' });
  }
});
