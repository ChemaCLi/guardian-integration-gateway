/**
 * Audit DB Port — Contract for audit storage
 *
 * This port defines the interface that any audit storage adapter must implement.
 * Use cases depend on this contract, never on specific adapters.
 *
 * Implementations must provide:
 * - saveAudit(entry: AuditEntry): Promise<void>
 *   Persists an audit entry; resolves when written, rejects on failure.
 *
 * @typedef {Object} AuditEntry
 * @property {string} userId - The user ID from the request
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} originalMessageEncrypted - Encrypted original message (contains PII)
 * @property {string} sanitizedMessage - Plaintext sanitized message (PII redacted)
 */

/**
 * @typedef {Object} AuditDbPort
 * @property {function(AuditEntry): Promise<void>} saveAudit
 */

/**
 * Saves an audit entry to the storage backend.
 *
 * @param {AuditEntry} entry - The audit entry to persist
 * @returns {Promise<void>} Resolves when written successfully
 * @throws {Error} Rejects on write failure
 */

// This file documents the contract. Adapters implement the actual logic.
// Example adapter: src/infrastructure/adapters/jsonAudit.adapter.js

module.exports = {
  // Contract documentation only - adapters provide the implementation
  // The factory (db.factory.js) returns the configured adapter instance
};
