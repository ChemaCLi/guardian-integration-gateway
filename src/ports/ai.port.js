/**
 * AI Port — Contract for AI providers
 *
 * This port defines the interface that any AI adapter must implement.
 * Use cases depend on this contract, never on specific adapters.
 *
 * Implementations must provide:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 *   Resolves with the AI-generated answer.
 *   Rejects on network error, timeout, or API failure.
 *
 * @typedef {Object} AIPort
 * @property {function(string): Promise<string>} generateAnswer
 */

/**
 * Generates an answer from the AI provider.
 *
 * @param {string} sanitizedMessage - The sanitized (PII-redacted) user message
 * @returns {Promise<string>} Resolves with the AI-generated answer
 * @throws {Error} Rejects on network error, timeout, or API failure
 */

// This file documents the contract. Adapters implement the actual logic.
// Example adapter: src/infrastructure/adapters/mockAI.adapter.js

module.exports = {
  // Contract documentation only - adapters provide the implementation
  // The factory (ai.factory.js) returns the configured adapter instance
};
