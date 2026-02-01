/**
 * Unit tests for Mock AI Adapter
 *
 * Tests the mock AI provider implementation that simulates
 * AI processing with a 2-second delay.
 */

const {
  generateAnswer,
  RESPONSE_DELAY_MS,
  DEFAULT_RESPONSE,
} = require('../mockAI.adapter');

describe('mockAI.adapter', () => {
  // Use fake timers to avoid waiting 2 seconds per test
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constants', () => {
    it('RESPONSE_DELAY_MS should be 2000', () => {
      expect(RESPONSE_DELAY_MS).toBe(2000);
    });

    it('DEFAULT_RESPONSE should be "Generated Answer"', () => {
      expect(DEFAULT_RESPONSE).toBe('Generated Answer');
    });
  });

  describe('generateAnswer', () => {
    describe('return value', () => {
      it('should return a Promise', () => {
        const result = generateAnswer('test message');
        expect(result).toBeInstanceOf(Promise);
      });

      it('should resolve to "Generated Answer"', async () => {
        const resultPromise = generateAnswer('test message');

        // Advance timers to resolve the promise
        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe('Generated Answer');
      });

      it('should return the same response regardless of input content', async () => {
        const inputs = [
          'Hello, how are you?',
          'What is the meaning of life?',
          'This is a <REDACTED: EMAIL> message',
          '12345',
          'a'.repeat(1000),
        ];

        for (const input of inputs) {
          const resultPromise = generateAnswer(input);
          jest.advanceTimersByTime(RESPONSE_DELAY_MS);
          const result = await resultPromise;
          expect(result).toBe(DEFAULT_RESPONSE);
        }
      });
    });

    describe('delay behavior', () => {
      it('should not resolve before RESPONSE_DELAY_MS', async () => {
        let resolved = false;
        const resultPromise = generateAnswer('test').then(() => {
          resolved = true;
        });

        // Advance time just before the delay
        jest.advanceTimersByTime(RESPONSE_DELAY_MS - 1);

        // Let any pending promises settle
        await Promise.resolve();

        expect(resolved).toBe(false);

        // Now advance past the delay
        jest.advanceTimersByTime(1);
        await resultPromise;

        expect(resolved).toBe(true);
      });

      it('should resolve after exactly RESPONSE_DELAY_MS (2000ms)', async () => {
        const resultPromise = generateAnswer('test message');

        // Advance exactly 2000ms
        jest.advanceTimersByTime(2000);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });

      it('should resolve after advancing timers by RESPONSE_DELAY_MS', async () => {
        const startTime = Date.now();
        const resultPromise = generateAnswer('test');

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        await resultPromise;

        // With fake timers, Date.now() also advances
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBe(RESPONSE_DELAY_MS);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string input', async () => {
        const resultPromise = generateAnswer('');

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });

      it('should handle undefined input', async () => {
        const resultPromise = generateAnswer(undefined);

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });

      it('should handle null input', async () => {
        const resultPromise = generateAnswer(null);

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });

      it('should handle non-string input (number)', async () => {
        const resultPromise = generateAnswer(12345);

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });

      it('should handle non-string input (object)', async () => {
        const resultPromise = generateAnswer({ message: 'test' });

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const result = await resultPromise;
        expect(result).toBe(DEFAULT_RESPONSE);
      });
    });

    describe('concurrent calls', () => {
      it('should handle multiple concurrent calls independently', async () => {
        const promise1 = generateAnswer('message 1');
        const promise2 = generateAnswer('message 2');
        const promise3 = generateAnswer('message 3');

        jest.advanceTimersByTime(RESPONSE_DELAY_MS);

        const results = await Promise.all([promise1, promise2, promise3]);

        expect(results).toEqual([
          DEFAULT_RESPONSE,
          DEFAULT_RESPONSE,
          DEFAULT_RESPONSE,
        ]);
      });
    });
  });
});
