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
      // Use a valid 36-character token after ghp_
      const originalToken = 'ghp_1234567890abcdefghijklmnopqrstuv1234';
      const encrypted = encryptGithubToken(originalToken);
      const decrypted = decryptGithubToken(encrypted);
      
      expect(decrypted).toBe(originalToken);
      expect(encrypted).not.toBe(originalToken);
    });

    test('should validate GitHub token format', () => {
      // ghp_ tokens have 36 characters after the prefix (total 40 chars)
      const validGhpToken = 'ghp_' + 'a'.repeat(36);
      expect(validateGithubTokenFormat(validGhpToken)).toBe(true);
      expect(validateGithubTokenFormat('invalid-token')).toBe(false);
      // github_pat_ tokens have 82 characters after the prefix
      expect(validateGithubTokenFormat('github_pat_' + 'A'.repeat(82))).toBe(true);
    });
  });
});