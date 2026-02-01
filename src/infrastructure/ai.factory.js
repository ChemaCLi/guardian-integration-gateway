/**
 * AI Factory — Returns the configured AI adapter
 *
 * Single point to swap between mock and real AI providers.
 * Currently returns the mock AI adapter for development.
 */

const mockAIAdapter = require('./adapters/mockAI.adapter');

/**
 * Gets the configured AI adapter instance.
 *
 * The adapter implements the AI port contract:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 *
 * @returns {Object} AI adapter with generateAnswer method
 */
function getAIAdapter() {
  // For now, always return the mock adapter
  // In the future, this can check config/env to return a real provider
  return mockAIAdapter;
}

module.exports = {
  getAIAdapter,
};
