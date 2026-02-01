/**
 * Secure Inquiry Use Case — Orchestrates sanitize → AI → audit flow
 *
 * Processes user inquiries by:
 * 1. Checking circuit breaker (fail-fast if open)
 * 2. Sanitizing the message (redacting PII)
 * 3. Calling AI with sanitized message
 * 4. Auditing the request (encrypted original + plaintext sanitized)
 * 5. Returning the AI answer
 */

/**
 * Custom error class for circuit breaker open state.
 * Route layer can check for this to return 503.
 */
class CircuitOpenError extends Error {
  constructor() {
    super('Service Busy');
    this.name = 'CircuitOpenError';
    this.isCircuitOpen = true;
  }
}

/**
 * Creates a secure inquiry executor with injected dependencies.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.sanitizer - Sanitizer service with sanitize(message)
 * @param {Object} dependencies.circuitBreaker - Circuit breaker service with isOpen(), recordFailure(), recordSuccess()
 * @param {Object} dependencies.aiPort - AI adapter with generateAnswer(sanitizedMessage)
 * @param {Object} dependencies.auditDbPort - Audit DB adapter with saveAudit(entry)
 * @param {Object} dependencies.cryptoUtil - Crypto utility with encrypt(text)
 * @returns {Function} executeSecureInquiry function
 */
function createSecureInquiryUseCase(dependencies) {
  const { sanitizer, circuitBreaker, aiPort, auditDbPort, cryptoUtil } = dependencies;

  /**
   * Processes a secure inquiry: sanitizes message, calls AI, audits the request.
   *
   * @param {Object} params - Request parameters
   * @param {string} params.userId - User identifier
   * @param {string} params.message - Raw user message (may contain PII)
   * @returns {Promise<{answer: string}>} AI-generated answer
   * @throws {CircuitOpenError} If circuit breaker is open
   * @throws {Error} On AI or audit failure
   */
  async function executeSecureInquiry({ userId, message }) {
    // Step 1: Check circuit breaker - fail fast if open
    if (circuitBreaker.isOpen()) {
      throw new CircuitOpenError();
    }

    // Step 2: Sanitize the message (redact PII)
    const sanitizedMessage = sanitizer.sanitize(message);

    // Step 3: Call AI with sanitized message only
    let answer;
    try {
      answer = await aiPort.generateAnswer(sanitizedMessage);
      circuitBreaker.recordSuccess();
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }

    // Step 4: Audit the request (on success only)
    const timestamp = new Date().toISOString();
    const originalMessageEncrypted = cryptoUtil.encrypt(message);

    const auditEntry = {
      userId,
      timestamp,
      originalMessageEncrypted,
      sanitizedMessage,
    };

    await auditDbPort.saveAudit(auditEntry);

    // Step 5: Return the answer
    return { answer };
  }

  return executeSecureInquiry;
}

module.exports = {
  createSecureInquiryUseCase,
  CircuitOpenError,
};
