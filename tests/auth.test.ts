import { validateAdminCredentials } from '../server/admin-credentials';
import { encryptGithubToken, decryptGithubToken, validateGithubTokenFormat } from '../lib/encryption';

describe('Authentication and Security', () => {
  describe('Admin Credentials', () => {
    test('should validate correct admin credentials', () => {
      const isValid = validateAdminCredentials('testadmin', 'testpassword');
      expect(isValid).toBe(true);
    });

    test('should reject invalid credentials', () => {
      const isValid = validateAdminCredentials('wrong', 'credentials');
      expect(isValid).toBe(false);
    });

    test('should reject empty credentials', () => {
      const isValid = validateAdminCredentials('', '');
      expect(isValid).toBe(false);
    });
  });

  describe('GitHub Token Encryption', () => {
    test('should encrypt and decrypt GitHub token correctly', () => {
      const originalToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123';
      const encrypted = encryptGithubToken(originalToken);
      const decrypted = decryptGithubToken(encrypted);
      
      expect(decrypted).toBe(originalToken);
      expect(encrypted).not.toBe(originalToken);
    });

    test('should validate GitHub token format', () => {
      expect(validateGithubTokenFormat('ghp_1234567890abcdefghijklmnopqrstuvwxyz123')).toBe(true);
      expect(validateGithubTokenFormat('invalid-token')).toBe(false);
      expect(validateGithubTokenFormat('github_pat_11ABCDEFG0ABC' + 'D'.repeat(69))).toBe(true);
    });
  });
});