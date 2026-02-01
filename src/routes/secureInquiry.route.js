/**
 * Secure Inquiry Route — POST /secure-inquiry
 *
 * Handles HTTP requests for secure AI inquiries.
 * Validates input, calls use case, maps results to HTTP responses.
 */

const express = require('express');
const { createSecureInquiryUseCase, CircuitOpenError } = require('../usecases/secureInquiry.usecase');
const { getAIAdapter } = require('../infrastructure/ai.factory');
const { getAuditDbAdapter } = require('../infrastructure/db.factory');
const sanitizer = require('../services/sanitizer.service');
const circuitBreaker = require('../services/circuitBreaker.service');
const cryptoUtil = require('../utils/crypto.util');

const router = express.Router();

/**
 * Validates the request body for secure inquiry.
 *
 * @param {Object} body - Request body
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateRequest(body) {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  const { userId, message } = body;

  if (userId === undefined || userId === null) {
    return { valid: false, error: 'userId is required' };
  }

  if (typeof userId !== 'string') {
    return { valid: false, error: 'userId must be a string' };
  }

  if (userId.trim() === '') {
    return { valid: false, error: 'userId cannot be empty' };
  }

  if (message === undefined || message === null) {
    return { valid: false, error: 'message is required' };
  }

  if (typeof message !== 'string') {
    return { valid: false, error: 'message must be a string' };
  }

  if (message.trim() === '') {
    return { valid: false, error: 'message cannot be empty' };
  }

  return { valid: true };
}

// Create the use case with dependencies
const executeSecureInquiry = createSecureInquiryUseCase({
  sanitizer,
  circuitBreaker,
  aiPort: getAIAdapter(),
  auditDbPort: getAuditDbAdapter(),
  cryptoUtil,
});

/**
 * POST /secure-inquiry
 *
 * Accepts a JSON body with userId and message.
 * Returns the AI-generated answer or appropriate error.
 *
 * @route POST /secure-inquiry
 * @param {Object} req.body - Request body
 * @param {string} req.body.userId - User identifier
 * @param {string} req.body.message - User message (may contain PII)
 * @returns {Object} { answer: string } on success
 * @returns {Object} { error: string } on failure
 */
router.post('/secure-inquiry', async (req, res) => {
  // Step 1: Validate request
  const validation = validateRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { userId, message } = req.body;

  // Step 2: Call use case
  try {
    const result = await executeSecureInquiry({ userId, message });
    return res.status(200).json({ answer: result.answer });
  } catch (error) {
    // Step 3: Handle errors
    if (error instanceof CircuitOpenError || error.isCircuitOpen) {
      return res.status(503).json({ error: 'Service Busy' });
    }

    // Log error for debugging (in production, use proper logging)
    console.error('Secure inquiry error:', error.message);

    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
