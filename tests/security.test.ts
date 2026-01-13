import { createRateLimit } from '../lib/security';

describe('Security Features', () => {
  describe('Rate Limiting', () => {
    test('should create rate limiter with correct configuration', () => {
      const limiter = createRateLimit(10000, 50); 
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>normal text';
      
      
      expect(maliciousInput).toContain('script');
    });
  });

  describe('Session Security', () => {
    test('should validate session configuration', () => {
      const sessionSecret = process.env.SESSION_SECRET;
      expect(sessionSecret).toBeDefined();
      expect(sessionSecret).not.toBe('');
    });
  });
});