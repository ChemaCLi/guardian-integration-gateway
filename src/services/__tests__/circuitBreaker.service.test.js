/**
 * Unit tests for circuitBreaker.service.js
 *
 * Tests the circuit breaker pattern implementation that tracks consecutive
 * AI call failures and opens the circuit after 3 failures.
 */

const {
  isOpen,
  recordFailure,
  recordSuccess,
  reset,
  getFailureCount,
  FAILURE_THRESHOLD,
} = require('../circuitBreaker.service');

describe('circuitBreaker.service', () => {
  // Reset state before each test to ensure isolation
  beforeEach(() => {
    reset();
  });

  describe('FAILURE_THRESHOLD', () => {
    it('should be 3', () => {
      expect(FAILURE_THRESHOLD).toBe(3);
    });
  });

  describe('circuit starts closed', () => {
    it('should return false initially (no failures recorded)', () => {
      expect(isOpen()).toBe(false);
    });

    it('should have failure count of 0 initially', () => {
      expect(getFailureCount()).toBe(0);
    });
  });

  describe('consecutive failures open the circuit', () => {
    it('should return false after 1 failure', () => {
      recordFailure();

      expect(isOpen()).toBe(false);
      expect(getFailureCount()).toBe(1);
    });

    it('should return false after 2 failures', () => {
      recordFailure();
      recordFailure();

      expect(isOpen()).toBe(false);
      expect(getFailureCount()).toBe(2);
    });

    it('should return true after exactly 3 consecutive failures', () => {
      recordFailure();
      recordFailure();
      recordFailure();

      expect(isOpen()).toBe(true);
      expect(getFailureCount()).toBe(3);
    });
  });

  describe('success resets failure count', () => {
    it('should reset count to 0 after 1 failure', () => {
      recordFailure();
      expect(getFailureCount()).toBe(1);

      recordSuccess();

      expect(getFailureCount()).toBe(0);
      expect(isOpen()).toBe(false);
    });

    it('should reset count to 0 after 2 failures', () => {
      recordFailure();
      recordFailure();
      expect(getFailureCount()).toBe(2);

      recordSuccess();

      expect(getFailureCount()).toBe(0);
      expect(isOpen()).toBe(false);
    });

    it('should require 3 more failures to open circuit again after reset', () => {
      // First: 2 failures then success
      recordFailure();
      recordFailure();
      recordSuccess();

      expect(isOpen()).toBe(false);
      expect(getFailureCount()).toBe(0);

      // Need 3 more failures to open
      recordFailure();
      expect(isOpen()).toBe(false);

      recordFailure();
      expect(isOpen()).toBe(false);

      recordFailure();
      expect(isOpen()).toBe(true);
      expect(getFailureCount()).toBe(3);
    });
  });

  describe('circuit stays open until success', () => {
    it('should stay open until recordSuccess() is called', () => {
      // Open the circuit
      recordFailure();
      recordFailure();
      recordFailure();
      expect(isOpen()).toBe(true);

      // Circuit stays open without success
      expect(isOpen()).toBe(true);

      // Success closes it
      recordSuccess();
      expect(isOpen()).toBe(false);
    });

    it('should remain open after 4th failure', () => {
      recordFailure();
      recordFailure();
      recordFailure();
      recordFailure();

      expect(isOpen()).toBe(true);
      expect(getFailureCount()).toBe(4);
    });

    it('should remain open after 5th failure', () => {
      recordFailure();
      recordFailure();
      recordFailure();
      recordFailure();
      recordFailure();

      expect(isOpen()).toBe(true);
      expect(getFailureCount()).toBe(5);
    });
  });

  describe('reset function', () => {
    it('should close the circuit and set failure count to 0', () => {
      // Open the circuit
      recordFailure();
      recordFailure();
      recordFailure();
      expect(isOpen()).toBe(true);
      expect(getFailureCount()).toBe(3);

      // Reset
      reset();

      expect(isOpen()).toBe(false);
      expect(getFailureCount()).toBe(0);
    });

    it('should work when circuit is not open', () => {
      recordFailure();
      recordFailure();
      expect(getFailureCount()).toBe(2);

      reset();

      expect(isOpen()).toBe(false);
      expect(getFailureCount()).toBe(0);
    });
  });

  describe('getFailureCount', () => {
    it('should return current failure count', () => {
      expect(getFailureCount()).toBe(0);

      recordFailure();
      expect(getFailureCount()).toBe(1);

      recordFailure();
      expect(getFailureCount()).toBe(2);

      recordFailure();
      expect(getFailureCount()).toBe(3);
    });

    it('should return 0 after reset', () => {
      recordFailure();
      recordFailure();
      expect(getFailureCount()).toBe(2);

      reset();

      expect(getFailureCount()).toBe(0);
    });

    it('should return 0 after recordSuccess', () => {
      recordFailure();
      recordFailure();
      expect(getFailureCount()).toBe(2);

      recordSuccess();

      expect(getFailureCount()).toBe(0);
    });
  });
});
