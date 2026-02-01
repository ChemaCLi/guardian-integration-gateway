/**
 * AI Port — Abstract contract for AI providers
 *
 * This port defines the interface that any AI adapter must implement.
 * Use cases depend on this contract, never on specific adapters.
 *
 * Subclasses must implement:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 */

export abstract class AIPort {
  /**
   * Generates an answer from the AI provider.
   * Must be implemented by adapters.
   *
   * @param sanitizedMessage - The sanitized (PII-redacted) user message
   * @returns Resolves with the AI-generated answer
   * @throws Rejects on network error, timeout, or API failure
   */
  abstract generateAnswer(sanitizedMessage: string): Promise<string>;
}
