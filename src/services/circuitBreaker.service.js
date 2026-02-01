/**
 * Circuit Breaker Service — Tracks AI call failures
 *
 * Opens after 3 consecutive failures to fail-fast with "Service Busy".
 * Resets failure count on success.
 *
 * States:
 * - Closed: Normal operation, AI calls allowed
 * - Open: After 3 consecutive failures, isOpen() returns true
 *
 * No external I/O; pure in-memory state tracking.
 */

/** Threshold for consecutive failures before opening the circuit */
const FAILURE_THRESHOLD = 3;

/** Current consecutive failure count */
let failureCount = 0;

/**
 * Checks if the circuit is open (fail-fast mode).
 *
 * When open, the use case should return "Service Busy" immediately
 * without calling the AI adapter.
 *
 * @returns {boolean} True if circuit is open (3+ consecutive failures)
 */
function isOpen() {
  return failureCount >= FAILURE_THRESHOLD;
}

/**
 * Records a failed AI call.
 *
 * Increments the consecutive failure count.
 * After 3 consecutive failures, the circuit opens.
 *
 * @returns {void}
 */
function recordFailure() {
  failureCount += 1;
}

/**
 * Records a successful AI call.
 *
 * Resets the consecutive failure count to zero.
 * This closes the circuit if it was open.
 *
 * @returns {void}
 */
function recordSuccess() {
  failureCount = 0;
}

/**
 * Resets the circuit breaker state (for testing purposes).
 *
 * @returns {void}
 */
function reset() {
  failureCount = 0;
}

/**
 * Gets the current failure count (for testing/debugging).
 *
 * @returns {number} Current consecutive failure count
 */
function getFailureCount() {
  return failureCount;
}

module.exports = {
  isOpen,
  recordFailure,
  recordSuccess,
  reset,
  getFailureCount,
  FAILURE_THRESHOLD,
};
