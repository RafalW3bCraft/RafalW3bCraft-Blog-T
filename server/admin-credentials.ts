import crypto from 'crypto';

// Admin credential configuration
export interface AdminCredentials {
  username: string;
  passwordHash: string;
}

// SHA-512 hash function
export function hashPassword(password: string): string {
  return crypto.createHash('sha512').update(password).digest('hex');
}

// Verify password against hash
export function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}

// Get admin credentials from environment
export function getAdminCredentials(): AdminCredentials {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables');
  }
  
  return {
    username,
    passwordHash: hashPassword(password)
  };
}

// Validate admin credentials
export function validateAdminCredentials(inputUsername: string, inputPassword: string): boolean {
  try {
    const adminCreds = getAdminCredentials();
    return inputUsername === adminCreds.username && verifyPassword(inputPassword, adminCreds.passwordHash);
  } catch (error) {
    console.error('Admin credential validation error:', error);
    return false;
  }
}