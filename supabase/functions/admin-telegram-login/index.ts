const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function githubAdmin(token: string) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const [userResponse, repoResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/repos/waslni/waslni', { headers })
  ]);
  if (!userResponse.ok || !repoResponse.ok) return null;
  const [user, repo] = await Promise.all([userResponse.json(), repoResponse.json()]);
  return repo.full_name?.toLowerCase() === 'waslni/waslni' && repo.permissions?.push === true ? String(user.login) : null;
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`;
  return fetch(url, { ...init, headers: { apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { message: 'Method not allowed.' });
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!botToken || !chatId || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return json(503, { message: 'إعداد Telegram أو خدمة التحقق غير مكتمل على الخادم.' });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { message: 'الطلب غير صالح.' }); }
  const action = String(body.action || '');
  const githubToken = String(body.githubToken || '').trim();
  if (!githubToken || githubToken.length > 500) return json(400, { message: 'أدخل رمز GitHub صالحًا.' });
  const login = await githubAdmin(githubToken);
  if (!login) return json(403, { message: 'رمز GitHub غير صالح أو لا يملك صلاحية الكتابة في مستودع وصلني.' });

  if (action === 'send') {
    const recentResponse = await adminFetch(`admin_login_challenges?github_login=eq.${encodeURIComponent(login)}&created_at=gte.${encodeURIComponent(new Date(Date.now() - 60_000).toISOString())}&select=id&limit=1`);
    if (!recentResponse.ok) return json(503, { message: 'تعذر التحقق من مهلة إرسال الرمز.' });
    if ((await recentResponse.json()).length) return json(429, { message: 'انتظر دقيقة قبل طلب رمز جديد.' });
    const id = crypto.randomUUID();
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${code}:${id}`));
    const codeHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const created = await adminFetch('admin_login_challenges', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id, github_login: login, code_hash: codeHash, expires_at: new Date(Date.now() + 5 * 60_000).toISOString() }) });
    if (!created.ok) return json(503, { message: 'تعذر إنشاء رمز التحقق على الخادم.' });
    const sent = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: `رمز دخول مدير وصلني: ${code}\nصالح لمدة 5 دقائق، ويسمح بمحاولتين فقط. إذا لم تطلبه فتجاهل الرسالة.` }) });
    const result = await sent.json().catch(() => ({}));
    if (!sent.ok || !result.ok) {
      await adminFetch(`admin_login_challenges?id=eq.${id}`, { method: 'DELETE' });
      return json(502, { message: 'تعذر إرسال الرمز إلى Telegram. تحقق من إعدادات البوت على الخادم.' });
    }
    return json(200, { challengeId: id, message: 'أرسلنا رمز الدخول إلى Telegram.' });
  }

  if (action === 'verify') {
    const challengeId = String(body.challengeId || '');
    const code = String(body.code || '');
    if (!/^[0-9a-f-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(code)) return json(400, { message: 'أدخل رمز التحقق المكوّن من 6 أرقام.' });
    const lookup = await adminFetch(`admin_login_challenges?id=eq.${challengeId}&select=github_login&limit=1`);
    const rows = lookup.ok ? await lookup.json() : [];
    if (!rows.length || rows[0].github_login !== login) return json(403, { message: 'جلسة التحقق غير صالحة. اطلب رمزًا جديدًا.' });
    const verified = await adminFetch('rpc/consume_admin_login_code', { method: 'POST', body: JSON.stringify({ p_challenge_id: challengeId, p_code: code }) });
    const result = verified.ok ? await verified.json() : null;
    if (result === 'verified') return json(200, { success: true, login });
    if (result === 'locked' || result === 'expired_or_locked') return json(429, { message: 'انتهت صلاحية الرمز أو استُنفدت المحاولتان. اطلب رمزًا جديدًا بعد انتهاء مهلة الإرسال.' });
    return json(401, { message: 'رمز التحقق غير صحيح. بقيت محاولة واحدة.' });
  }
  return json(400, { message: 'طلب غير مدعوم.' });
});
