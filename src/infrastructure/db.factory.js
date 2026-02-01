/**
 * DB Factory — Returns the configured audit DB adapter instance
 *
 * Single point to swap between mock (JSON file) and real database.
 * Currently returns an instance of the JSON audit adapter for development.
 */

const { JsonAuditAdapter } = require('./adapters/jsonAudit.adapter');

/**
 * Gets the configured audit DB adapter instance.
 *
 * The adapter extends AuditDbPort and implements:
 * - saveAudit(entry: AuditEntry): Promise<void>
 *
 * @returns {AuditDbPort} Audit DB adapter instance (e.g. JsonAuditAdapter)
 */
function getAuditDbAdapter() {
  return new JsonAuditAdapter();
}

module.exports = {
  getAuditDbAdapter,
};
