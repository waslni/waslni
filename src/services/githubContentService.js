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
    const error = new Error(data.message || `تعذر إكمال العملية في GitHub (${response.status}).`);
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
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100);
  if (!safeName) throw new Error('اسم الملف غير صالح. أعد تسمية الملف باللغة الإنجليزية أو الأرقام.');
  const path = `public/media/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const payload = {
    message: `Add media ${safeName}`,
    content: encodeBytesBase64(bytes),
    branch: BRANCH
  };
  await fetch(`${API_ROOT}/contents/${path}`, { method: 'PUT', headers: headers(token, true), body: JSON.stringify(payload) }).then(readResponse);
  return path.replace(/^public\//, '');
}
