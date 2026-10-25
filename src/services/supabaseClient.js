const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SESSION_KEY = 'waslni_supabase_session';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

function readSession() {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (typeof localStorage === 'undefined') return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function refreshSession(session) {
  if (!session?.refresh_token) return session;
  const refreshAt = Number(session.expires_at || 0) * 1000 - 60_000;
  if (!refreshAt || Date.now() < refreshAt) return session;
  const refreshed = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    authenticated: false,
    body: { refresh_token: session.refresh_token },
    skipRefresh: true
  });
  if (refreshed?.access_token) writeSession(refreshed);
  return refreshed?.access_token ? refreshed : session;
}

async function request(path, { method = 'GET', body, headers = {}, authenticated = true, skipRefresh = false } = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('إعدادات Supabase غير مكتملة. أضف VITE_SUPABASE_URL وVITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  let session = authenticated ? readSession() : null;
  if (authenticated && !skipRefresh) session = await refreshSession(session);
  const accessToken = session?.access_token || SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    if (response.status === 401 && authenticated) writeSession(null);
    const error = new Error(result?.msg || result?.message || result?.error_description || result?.error || 'تعذر الاتصال بالخادم.');
    error.status = response.status;
    error.code = result?.code;
    throw error;
  }
  return result;
}

export const supabaseClient = {
  getSession: readSession,
  setSession: writeSession,
  async signUp({ email, password, metadata }) {
    const redirect = typeof window !== 'undefined' ? `?redirect_to=${encodeURIComponent(window.location.origin + window.location.pathname)}` : '';
    const result = await request(`/auth/v1/signup${redirect}`, {
      method: 'POST', authenticated: false, body: { email, password, data: metadata }
    });
    if (result?.access_token) writeSession(result);
    // GoTrue returns a bare user object when email confirmation is enabled,
    // but a token response (with `user`) when confirmation is disabled.
    // Normalize both API shapes for registerCustomer.
    if (result && !result.user && result.id && !result.access_token) {
      return { ...result, user: result };
    }
    return result;
  },
  async signInWithPassword({ email, password }) {
    const result = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      authenticated: false,
      body: { email, password }
    });
    if (result?.access_token) writeSession(result);
    return result;
  },
  async getUser() {
    const session = readSession();
    if (!session?.access_token) return null;
    return request('/auth/v1/user');
  },
  async signOut() {
    try {
      if (readSession()?.access_token) await request('/auth/v1/logout?scope=local', { method: 'POST' });
    } finally {
      writeSession(null);
    }
  },
  async rest(path, options = {}) {
    return request(`/rest/v1/${path}`, options);
  },
  async rpc(name, args = {}) {
    return request(`/rest/v1/rpc/${encodeURIComponent(name)}`, { method: 'POST', body: args });
  },
  async invoke(functionName, body = {}) {
    return request(`/functions/v1/${encodeURIComponent(functionName)}`, { method: 'POST', body });
  },
  async uploadPublicFile(bucket, objectPath, file) {
    if (!(file instanceof Blob)) throw new Error('اختر ملفًا صالحًا للرفع.');
    const session = await refreshSession(readSession());
    if (!session?.access_token) throw new Error('سجّل الدخول قبل رفع الملفات.');
    const safePath = objectPath.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${safePath}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false'
      },
      body: file
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || 'تعذر رفع الملف إلى التخزين.');
    return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(bucket)}/${safePath}`;
  },
  async removePublicFile(bucket, objectPath) {
    const session = await refreshSession(readSession());
    if (!session?.access_token) throw new Error('سجّل الدخول لإزالة الملف.');
    const safePath = objectPath.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${safePath}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` }
    });
    if (!response.ok && response.status !== 404) throw new Error('تعذر حذف الملف من التخزين.');
    return true;
  }
};
