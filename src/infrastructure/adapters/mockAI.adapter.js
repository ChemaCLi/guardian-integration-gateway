/**
 * Mock AI Adapter — Implements AI port for development and testing
 *
 * Simulates an AI provider with a 2-second delay before returning a response.
 * Used for development without requiring a real LLM connection.
 */

/** Delay in milliseconds before responding */
const RESPONSE_DELAY_MS = 2000;

/** Default response message */
const DEFAULT_RESPONSE = 'Generated Answer';

/**
 * Generates an answer from the mock AI provider.
 *
 * Simulates AI processing with a 2-second delay, then returns
 * a fixed response. The sanitized message is accepted but not
 * actually processed (this is a mock).
 *
 * @param {string} sanitizedMessage - The sanitized (PII-redacted) user message
 * @returns {Promise<string>} Resolves with "Generated Answer" after 2 seconds
 */
function generateAnswer(sanitizedMessage) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DEFAULT_RESPONSE);
    }, RESPONSE_DELAY_MS);
  });
}

module.exports = {
  generateAnswer,
  // Export constants for testing
  RESPONSE_DELAY_MS,
  DEFAULT_RESPONSE,
};
