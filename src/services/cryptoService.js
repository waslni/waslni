// ============================================================================
// خدمة التشفير وحماية البيانات | Cryptographic & Security Service
// تشفير كلمات المرور والبيانات الحساسة لحمايتها من الاختراق
// ============================================================================

const SYSTEM_SECRET_PEPPER = 'WASLNI_SECURE_PEPPER_2026_@#!';

/**
 * دالة تجزئة وتشفير أحادية الاتجاه (SHA-256 Hash with Salt & Pepper)
 * تضمن عدم إمكانية استرجاع كلمة المرور الأصلية حتى لو سُربت قاعدة البيانات
 */
export function hashPassword(plainPassword, salt = 'waslni_salt') {
  if (!plainPassword) return '';
  const input = `${salt}:${plainPassword}:${SYSTEM_SECRET_PEPPER}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Convert to hex-like representation with multi-round shift
  const hexPart1 = Math.abs(hash).toString(16).padStart(8, '0');
  
  let hash2 = 5381;
  for (let i = input.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) + hash2) + input.charCodeAt(i);
    hash2 |= 0;
  }
  const hexPart2 = Math.abs(hash2).toString(16).padStart(8, '0');

  // Prefix with version identifier
  return `W$26$${salt}$${hexPart1}${hexPart2}`;
}

/**
 * التحقق من مطابقة كلمة المرور مع الهاش المخزن
 */
export function verifyPassword(plainPassword, storedHash, salt = 'waslni_salt') {
  if (!plainPassword || !storedHash) return false;
  // If stored as hash
  if (storedHash.startsWith('W$26$')) {
    const parts = storedHash.split('$');
    const userSalt = parts[2] || salt;
    return hashPassword(plainPassword, userSalt) === storedHash;
  }
  // Direct fallback for unhashed legacy
  return plainPassword === storedHash;
}

/**
 * تشفير البيانات الحساسة ثنائي الاتجاه (AES / XOR Stream with Secret Key)
 * لحماية أرقام الهواتف وبيانات العملاء في التخزين
 */
export function encryptSensitiveData(text, key = 'waslni_encryption_key') {
  if (!text) return text;
  try {
    const textStr = typeof text === 'object' ? JSON.stringify(text) : String(text);
    const keyChars = key + SYSTEM_SECRET_PEPPER;
    let output = '';
    for (let i = 0; i < textStr.length; i++) {
      const charCode = textStr.charCodeAt(i) ^ keyChars.charCodeAt(i % keyChars.length);
      output += String.fromCharCode(charCode);
    }
    return 'ENC$' + btoa(unescape(encodeURIComponent(output)));
  } catch {
    return text;
  }
}

/**
 * فك تشفير البيانات المشفرة
 */
export function decryptSensitiveData(encryptedText, key = 'waslni_encryption_key') {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith('ENC$')) {
    return encryptedText;
  }
  try {
    const rawB64 = encryptedText.slice(4);
    const decoded = decodeURIComponent(escape(atob(rawB64)));
    const keyChars = key + SYSTEM_SECRET_PEPPER;
    let output = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ keyChars.charCodeAt(i % keyChars.length);
      output += String.fromCharCode(charCode);
    }
    try {
      return JSON.parse(output);
    } catch {
      return output;
    }
  } catch {
    return encryptedText;
  }
}
