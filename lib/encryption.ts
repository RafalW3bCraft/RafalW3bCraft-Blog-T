import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

if (!process.env.ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not set in environment. Using temporary key. Set ENCRYPTION_KEY for production.');
}

/**
 * Encrypts a GitHub token using AES-256-GCM
 */
export function encryptGithubToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a GitHub token encrypted with encryptGithubToken
 */
export function decryptGithubToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Validates GitHub token format (basic check)
 */
export function validateGithubTokenFormat(token: string): boolean {
  // GitHub Personal Access Tokens start with 'ghp_' and are 40 characters long
  // GitHub Fine-grained tokens start with 'github_pat_' 
  return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(token);
}

/**
 * Redacts token for logging purposes
 */
export function redactToken(token: string): string {
  if (token.length < 8) return '***';
  return token.substring(0, 4) + '***' + token.substring(token.length - 4);
}