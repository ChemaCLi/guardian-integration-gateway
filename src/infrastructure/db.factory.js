/**
 * DB Factory — Returns the configured audit DB adapter
 *
 * Single point to swap between mock (JSON file) and real database.
 * Currently returns the JSON audit adapter for development.
 */

const jsonAuditAdapter = require('./adapters/jsonAudit.adapter');

/**
 * Gets the configured audit DB adapter instance.
 *
 * The adapter implements the audit DB port contract:
 * - saveAudit(entry: AuditEntry): Promise<void>
 *
 * @returns {Object} Audit DB adapter with saveAudit method
 */
function getAuditDbAdapter() {
  // For now, always return the JSON file adapter
  // In the future, this can check config/env to return a real database adapter
  return jsonAuditAdapter;
}

module.exports = {
  getAuditDbAdapter,
};
