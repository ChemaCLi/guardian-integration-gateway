/**
 * AI Factory — Returns the configured AI adapter instance
 *
 * Single point to swap between mock and real AI providers.
 * Currently returns an instance of the mock AI adapter for development.
 */

const { MockAIAdapter } = require('./adapters/mockAI.adapter');

/**
 * Gets the configured AI adapter instance.
 *
 * The adapter extends AIPort and implements:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 *
 * @returns {AIPort} AI adapter instance (e.g. MockAIAdapter)
 */
function getAIAdapter() {
  return new MockAIAdapter();
}

module.exports = {
  getAIAdapter,
};
