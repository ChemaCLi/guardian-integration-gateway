/**
 * Sanitizer Service — PII redaction for user messages
 *
 * Detects and redacts sensitive data (emails, credit cards, SSNs) before
 * messages are sent to AI providers.
 *
 * No external I/O; pure string transformation.
 */

/**
 * RFC-style email regex pattern.
 * Matches typical email format: local@domain.tld
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Pattern for potential credit card numbers: 13-19 consecutive digits.
 * Actual validation uses Luhn algorithm.
 */
const POTENTIAL_CC_REGEX = /\b\d{13,19}\b/g;

/**
 * Pattern for SSN: exactly 9 consecutive digits (not part of longer sequence).
 * Uses word boundaries to avoid matching within larger numbers.
 */
const SSN_REGEX = /\b\d{9}\b/g;

/**
 * Validates a number string using the Luhn algorithm.
 * Used to verify credit card numbers.
 *
 * @param {string} numStr - String of digits to validate
 * @returns {boolean} True if the number passes Luhn validation
 */
function isValidLuhn(numStr) {
  const digits = numStr.split('').map(Number);
  const len = digits.length;

  let sum = 0;
  let isSecond = false;

  // Process from right to left
  for (let i = len - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isSecond) {
      digit = digit * 2;
      if (digit > 9) {
        digit = digit - 9;
      }
    }

    sum += digit;
    isSecond = !isSecond;
  }

  return sum % 10 === 0;
}

/**
 * Redacts email addresses in the message.
 *
 * @param {string} message - Input message
 * @returns {string} Message with emails replaced by <REDACTED: EMAIL>
 */
function redactEmails(message) {
  return message.replace(EMAIL_REGEX, '<REDACTED: EMAIL>');
}

/**
 * Redacts valid credit card numbers (Luhn-valid, 13-19 digits) in the message.
 *
 * @param {string} message - Input message
 * @returns {string} Message with credit cards replaced by <REDACTED: CREDIT_CARD>
 */
function redactCreditCards(message) {
  return message.replace(POTENTIAL_CC_REGEX, (match) => {
    if (isValidLuhn(match)) {
      return '<REDACTED: CREDIT_CARD>';
    }
    return match;
  });
}

/**
 * Redacts SSNs (exactly 9 consecutive digits) in the message.
 *
 * @param {string} message - Input message
 * @returns {string} Message with SSNs replaced by <REDACTED: SSN>
 */
function redactSSNs(message) {
  return message.replace(SSN_REGEX, '<REDACTED: SSN>');
}

/**
 * Sanitizes a message by replacing sensitive data with redaction placeholders.
 *
 * Redaction order: emails first, then credit cards, then SSNs.
 * This order avoids overlap issues.
 *
 * @param {string} message - Raw user message potentially containing PII
 * @returns {string} Sanitized message with emails, credit cards, and SSNs replaced by <REDACTED: TYPE>
 */
function sanitize(message) {
  if (typeof message !== 'string') {
    return '';
  }

  if (message === '') {
    return '';
  }

  // Apply redactions in order: email, credit card, SSN
  const afterEmails = redactEmails(message);
  const afterCreditCards = redactCreditCards(afterEmails);
  const afterSSNs = redactSSNs(afterCreditCards);

  return afterSSNs;
}

module.exports = {
  sanitize,
  // Export helpers for testing if needed
  isValidLuhn,
};
