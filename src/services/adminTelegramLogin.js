const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export async function adminTelegramLogin(payload) {
  if (!supabaseUrl || !publishableKey) throw new Error('إعداد Supabase غير موجود في بناء الموقع.');
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-telegram-login`, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'تعذر إكمال التحقق عبر Telegram.');
  return data;
}
