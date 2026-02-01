/**
 * Unit tests for application config.
 * Tests that config correctly loads from environment variables and .env file.
 */

describe('config', () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear the require cache so config is re-evaluated
    jest.resetModules();
    // Restore original env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env after all tests
    process.env = { ...originalEnv };
  });

  describe('basic structure', () => {
    it('exports an object with port, nodeEnv, and encryptionKey', () => {
      const config = require('../config.js');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('encryptionKey');
    });

    it('port is a positive number', () => {
      const config = require('../config.js');
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
    });

    it('nodeEnv is a string', () => {
      const config = require('../config.js');
      expect(typeof config.nodeEnv).toBe('string');
      expect(config.nodeEnv.length).toBeGreaterThan(0);
    });
  });

  describe('port configuration', () => {
    it('returns number from PORT env variable', () => {
      process.env.PORT = '5000';
      const config = require('../config.js');
      expect(config.port).toBe(5000);
    });

    it('uses .env PORT value when not overridden', () => {
      // This test verifies dotenv integration - .env has PORT=4000
      const config = require('../config.js');
      // If .env has PORT=4000, it should load that
      expect(config.port).toBe(4000);
    });

    it('prefers explicitly set env var over .env file', () => {
      // dotenv does NOT override existing env vars by default
      process.env.PORT = '9999';
      const config = require('../config.js');
      expect(config.port).toBe(9999);
    });

    it('handles empty string PORT by returning default', () => {
      process.env.PORT = '';
      const config = require('../config.js');
      // dotenv does NOT overwrite existing env vars (even empty string)
      // config.js treats empty string as "not set" and returns default
      expect(config.port).toBe(3000);
    });

    it('handles invalid PORT value', () => {
      process.env.PORT = 'invalid';
      const config = require('../config.js');
      expect(config.port).toBe(3000); // defaults to 3000 for invalid
    });

    it('handles negative PORT value', () => {
      process.env.PORT = '-100';
      const config = require('../config.js');
      expect(config.port).toBe(3000); // defaults to 3000 for negative
    });
  });

  describe('nodeEnv configuration', () => {
    it('returns NODE_ENV value when set', () => {
      process.env.NODE_ENV = 'production';
      const config = require('../config.js');
      expect(config.nodeEnv).toBe('production');
    });

    it('defaults to development when NODE_ENV is not in env or .env', () => {
      delete process.env.NODE_ENV;
      const config = require('../config.js');
      // NODE_ENV is not in our .env, so it defaults to 'development'
      expect(config.nodeEnv).toBe('development');
    });
  });

  describe('encryptionKey configuration', () => {
    it('returns ENCRYPTION_KEY value when set in env', () => {
      process.env.ENCRYPTION_KEY = 'my-override-key';
      const config = require('../config.js');
      expect(config.encryptionKey).toBe('my-override-key');
    });

    it('loads ENCRYPTION_KEY from .env file', () => {
      // .env has ENCRYPTION_KEY set
      const config = require('../config.js');
      expect(config.encryptionKey).toBe('dev-secret-key-for-testing-only-32chars');
    });

    it('returns undefined when ENCRYPTION_KEY is empty string', () => {
      process.env.ENCRYPTION_KEY = '';
      // dotenv does NOT overwrite existing env vars (even empty string)
      // config.js treats empty string as "not set" and returns undefined
      const config = require('../config.js');
      expect(config.encryptionKey).toBeUndefined();
    });
  });

  describe('dotenv integration', () => {
    it('loads dotenv without throwing', () => {
      expect(() => {
        require('../config.js');
      }).not.toThrow();
    });

    it('successfully loads values from .env file', () => {
      const config = require('../config.js');
      // Verify .env values are loaded
      expect(config.port).toBe(4000); // From .env: PORT=4000
      expect(config.encryptionKey).toBe('dev-secret-key-for-testing-only-32chars'); // From .env
    });
  });
});
