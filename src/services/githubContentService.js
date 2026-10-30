const OWNER = 'waslni';
const REPOSITORY = 'waslni';
const BRANCH = 'main';
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;
const SESSION_TOKEN_KEY = 'waslni_github_admin_token';

function headers(token, json = false) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(json ? { 'Content-Type': 'application/json' } : {})
  };
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = /resource not accessible by personal access token/i.test(data.message || '')
      ? 'رفض GitHub العملية لأن رمز الوصول لا يملك صلاحية Contents: Read and write لمستودع waslni/waslni. أنشئ رمزًا جديدًا بهذه الصلاحية، ثم سجّل الخروج من لوحة المدير وادخل بالرمز الجديد.'
      : response.status === 404
        ? 'لم يُعثر على الملف أو المجلد في مستودع GitHub. حدّث لوحة المدير وحاول مجددًا.'
        : response.status === 409 || response.status === 422
          ? 'رفض GitHub حفظ الملف بسبب تعارض في المستودع أو اسم الملف. حدّث لوحة المدير وأعد المحاولة.'
          : data.message || `تعذر إكمال العملية في GitHub (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBytesBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export const githubAdminSession = {
  read: () => sessionStorage.getItem(SESSION_TOKEN_KEY) || '',
  write: token => sessionStorage.setItem(SESSION_TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(SESSION_TOKEN_KEY)
};

export async function verifyGithubAdminToken(token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) throw new Error('أدخل رمز GitHub للوصول إلى لوحة الإدارة.');
  const [user, repository] = await Promise.all([
    fetch('https://api.github.com/user', { headers: headers(cleanToken) }).then(readResponse),
    fetch(API_ROOT, { headers: headers(cleanToken) }).then(readResponse)
  ]);
  if (repository.full_name?.toLowerCase() !== `${OWNER}/${REPOSITORY}` || repository.permissions?.push !== true) {
    throw new Error('هذا الحساب لا يملك صلاحية تعديل مستودع وصلني.');
  }
  return { login: user.login, avatarUrl: user.avatar_url };
}

export async function getRepositoryJson(path, token) {
  const data = await fetch(`${API_ROOT}/contents/${path}?ref=${BRANCH}`, { headers: headers(token) }).then(readResponse);
  return { value: JSON.parse(decodeBase64Utf8(data.content)), sha: data.sha };
}

export async function listRepositoryMedia(token) {
  const response = await fetch(`${API_ROOT}/contents/public/media?ref=${BRANCH}`, { headers: headers(token) });
  if (response.status === 404) return [];
  const files = await readResponse(response);
  return (Array.isArray(files) ? files : []).filter(file => file.type === 'file' && file.name !== '.gitkeep')
    .map(file => ({ name: file.name, path: file.path.replace(/^public\//, ''), size: file.size, downloadUrl: file.download_url }));
}

export async function saveRepositoryJson(path, value, token, sha, message) {
  const content = encodeBytesBase64(new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`));
  const payload = { message, content, branch: BRANCH, ...(sha ? { sha } : {}) };
  return fetch(`${API_ROOT}/contents/${path}`, { method: 'PUT', headers: headers(token, true), body: JSON.stringify(payload) }).then(readResponse);
}

export async function uploadRepositoryMedia(file, token) {
  const originalName = file.name.normalize('NFKD');
  const extension = originalName.match(/\.[a-z0-9]{1,8}$/i)?.[0]?.toLowerCase()
    || ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' }[file.type] || '');
  const nameWithoutExtension = extension ? originalName.slice(0, -extension.length) : originalName;
  const baseName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80);
  const safeName = `${baseName || 'media'}${extension}`;
  const path = `public/media/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const payload = {
    message: `Add media ${safeName}`,
    content: encodeBytesBase64(bytes),
    branch: BRANCH
  };
  await fetch(`${API_ROOT}/contents/${path}`, { method: 'PUT', headers: headers(token, true), body: JSON.stringify(payload) }).then(readResponse);
  return path.replace(/^public\//, '');
}
