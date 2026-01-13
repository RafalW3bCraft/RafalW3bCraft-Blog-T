import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Validate encryption key in production
if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be set in production environment');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set. Using temporary key - encrypted data will be lost on restart.');
}

export function encryptGithubToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptGithubToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function validateGithubTokenFormat(token: string): boolean {
  return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(token);
}

export function redactToken(token: string): string {
  if (token.length < 8) return '***';
  return token.substring(0, 4) + '***' + token.substring(token.length - 4);
}
