/**
 * Mock AI Adapter — Implements AI port for development and testing
 *
 * Simulates an AI provider with a 2-second delay before returning a response.
 * Used for development without requiring a real LLM connection.
 */

import { AIPort } from '../../ports/ai.port';

/** Delay in milliseconds before responding */
export const RESPONSE_DELAY_MS = 2000;

/** Default response message */
export const DEFAULT_RESPONSE = 'Generated Answer';

/**
 * Mock AI adapter that extends AIPort.
 * Simulates AI processing with a configurable delay.
 */
export class MockAIAdapter extends AIPort {
  /**
   * Generates an answer from the mock AI provider.
   * Simulates AI processing with a 2-second delay, then returns a fixed response.
   *
   * @param _sanitizedMessage - The sanitized (PII-redacted) user message (accepted but not processed)
   * @returns Resolves with "Generated Answer" after 2 seconds
   */
  generateAnswer(_sanitizedMessage: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(DEFAULT_RESPONSE);
      }, RESPONSE_DELAY_MS);
    });
  }
}
