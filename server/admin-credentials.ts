import crypto from 'crypto';

export interface AdminCredentials {
  username: string;
  passwordHash: string;
}

// Use PBKDF2 for password hashing (more secure than plain SHA-512)
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // Handle legacy SHA-512 hashes (no salt separator)
  if (!storedHash.includes(':')) {
    const inputHash = crypto.createHash('sha512').update(password).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
  }
  
  // Handle PBKDF2 hashes
  const [salt, hash] = storedHash.split(':');
  const inputHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}


export function getAdminCredentials(): AdminCredentials {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!username) {
    throw new Error('ADMIN_USERNAME must be set in environment variables');
  }
  
  // If a pre-hashed password is provided, use it
  if (passwordHash) {
    return { username, passwordHash };
  }
  
  // Otherwise, use plain password (for backward compatibility)
  if (!password) {
    throw new Error('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be set in environment variables');
  }
  
  return { username, passwordHash: password };
}

export function validateAdminCredentials(inputUsername: string, inputPassword: string): boolean {
  try {
    const adminCreds = getAdminCredentials();
    
    if (inputUsername !== adminCreds.username) {
      return false;
    }
    
    // Check if the stored hash is a PBKDF2 hash (contains ':')
    if (adminCreds.passwordHash.includes(':')) {
      return verifyPassword(inputPassword, adminCreds.passwordHash);
    }
    
    // For plain password comparison (backward compatibility)
    // Use timing-safe comparison
    const inputBuffer = Buffer.from(inputPassword);
    const storedBuffer = Buffer.from(adminCreds.passwordHash);
    
    if (inputBuffer.length !== storedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(inputBuffer, storedBuffer);
  } catch (error) {
    console.error('Admin credential validation error:', error);
    return false;
  }
}