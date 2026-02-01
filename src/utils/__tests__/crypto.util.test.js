/**
 * Unit tests for crypto.util.js
 *
 * Tests encrypt() and decrypt() functions for:
 * - Round-trip encryption/decryption
 * - Empty string handling
 * - Non-string input handling
 * - Encrypted text format validation
 * - Decryption error cases
 */

// Set encryption key before requiring the module (config is evaluated at require time)
process.env.ENCRYPTION_KEY = 'test-secret-key-for-unit-tests';

const { encrypt, decrypt } = require('../crypto.util');

describe('crypto.util', () => {
  describe('encrypt', () => {
    describe('encrypted text format', () => {
      it('returns string in format "iv:ciphertext" (contains a colon)', () => {
        const result = encrypt('hello');

        expect(typeof result).toBe('string');
        expect(result).toContain(':');

        const parts = result.split(':');
        expect(parts.length).toBe(2);
        expect(parts[0].length).toBeGreaterThan(0);
        expect(parts[1].length).toBeGreaterThan(0);
      });

      it('returns hex-encoded IV of 32 characters (16 bytes)', () => {
        const result = encrypt('test');
        const iv = result.split(':')[0];

        // 16 bytes = 32 hex characters
        expect(iv.length).toBe(32);
        expect(/^[0-9a-f]+$/i.test(iv)).toBe(true);
      });
    });

    describe('empty string handling', () => {
      it('returns empty string when input is empty string', () => {
        const result = encrypt('');

        expect(result).toBe('');
      });
    });

    describe('non-string input handling', () => {
      it('returns empty string when input is null', () => {
        const result = encrypt(null);

        expect(result).toBe('');
      });

      it('returns empty string when input is undefined', () => {
        const result = encrypt(undefined);

        expect(result).toBe('');
      });

      it('returns empty string when input is a number', () => {
        const result = encrypt(123);

        expect(result).toBe('');
      });

      it('returns empty string when input is an object', () => {
        const result = encrypt({ message: 'hello' });

        expect(result).toBe('');
      });

      it('returns empty string when input is an array', () => {
        const result = encrypt(['hello']);

        expect(result).toBe('');
      });
    });
  });

  describe('decrypt', () => {
    describe('empty string handling', () => {
      it('returns empty string when input is empty string', () => {
        const result = decrypt('');

        expect(result).toBe('');
      });
    });

    describe('non-string input handling', () => {
      it('returns empty string when input is null', () => {
        const result = decrypt(null);

        expect(result).toBe('');
      });

      it('returns empty string when input is undefined', () => {
        const result = decrypt(undefined);

        expect(result).toBe('');
      });
    });

    describe('decryption errors', () => {
      it('throws error when input has no colon (invalid format)', () => {
        expect(() => decrypt('invalidtext')).toThrow('Invalid encrypted text format');
      });

      it('throws error when input has multiple colons', () => {
        expect(() => decrypt('part1:part2:part3')).toThrow('Invalid encrypted text format');
      });

      it('throws error when IV is invalid hex', () => {
        expect(() => decrypt('notvalidhex:abcdef')).toThrow();
      });

      it('throws error when ciphertext is corrupted', () => {
        // Get a valid encrypted text and corrupt the ciphertext part
        const valid = encrypt('test message');
        const parts = valid.split(':');
        const corrupted = parts[0] + ':' + 'corrupted' + parts[1].slice(9);

        expect(() => decrypt(corrupted)).toThrow();
      });
    });
  });

  describe('round-trip encryption/decryption', () => {
    describe('various text lengths', () => {
      it('works with short text', () => {
        const original = 'Hi';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with medium text', () => {
        const original = 'This is a medium length message for testing purposes.';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with long text', () => {
        const original = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with single character', () => {
        const original = 'X';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });
    });

    describe('special characters and unicode', () => {
      it('works with special characters', () => {
        const original = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with unicode characters', () => {
        const original = '你好世界 مرحبا שלום';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with emoji', () => {
        const original = '🔐🔑🛡️ Secure Message 💬';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with newlines and tabs', () => {
        const original = 'Line 1\nLine 2\tTabbed';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });

      it('works with mixed content (text, numbers, special chars)', () => {
        const original = 'User: john@example.com - ID: 12345 - Card: 4111-1111-1111-1111';

        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
      });
    });

    describe('encryption uniqueness', () => {
      it('produces different ciphertext for same plaintext (random IV)', () => {
        const original = 'same message';

        const encrypted1 = encrypt(original);
        const encrypted2 = encrypt(original);

        // Different encryptions should produce different ciphertext (due to random IV)
        expect(encrypted1).not.toBe(encrypted2);

        // But both should decrypt to the same original
        expect(decrypt(encrypted1)).toBe(original);
        expect(decrypt(encrypted2)).toBe(original);
      });
    });
  });
});
