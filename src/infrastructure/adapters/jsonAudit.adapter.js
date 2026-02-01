/**
 * JSON Audit Adapter — Implements Audit DB port using a JSON file
 *
 * Appends audit entries to src/db/audit-log.json.
 * Creates the file if it doesn't exist.
 */

const fs = require('fs');
const path = require('path');

/** Path to the audit log file */
const AUDIT_LOG_PATH = path.join(__dirname, '../../db/audit-log.json');

/**
 * Ensures the audit log file exists.
 * Creates an empty array if the file doesn't exist.
 *
 * @returns {void}
 */
function ensureFileExists() {
  const dir = path.dirname(AUDIT_LOG_PATH);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create file with empty array if it doesn't exist
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    fs.writeFileSync(AUDIT_LOG_PATH, '[]', 'utf8');
  }
}

/**
 * Reads the current audit log entries.
 *
 * @returns {Array} Array of audit entries
 */
function readAuditLog() {
  ensureFileExists();

  const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');

  try {
    return JSON.parse(content);
  } catch (error) {
    // If file is corrupted, start fresh
    return [];
  }
}

/**
 * Writes entries to the audit log file.
 *
 * @param {Array} entries - Array of audit entries to write
 * @returns {void}
 */
function writeAuditLog(entries) {
  const content = JSON.stringify(entries, null, 2);
  fs.writeFileSync(AUDIT_LOG_PATH, content, 'utf8');
}

/**
 * Saves an audit entry to the JSON file.
 *
 * Entry shape (from auditDb.port.js):
 * - userId: string
 * - timestamp: string (ISO 8601)
 * - originalMessageEncrypted: string
 * - sanitizedMessage: string
 *
 * @param {Object} entry - Audit entry to save
 * @param {string} entry.userId - User identifier
 * @param {string} entry.timestamp - ISO 8601 timestamp
 * @param {string} entry.originalMessageEncrypted - Encrypted original message
 * @param {string} entry.sanitizedMessage - Sanitized (redacted) message
 * @returns {Promise<void>} Resolves when entry is written
 * @throws {Error} If write fails
 */
function saveAudit(entry) {
  return new Promise((resolve, reject) => {
    try {
      const entries = readAuditLog();
      entries.push(entry);
      writeAuditLog(entries);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gets the audit log file path (for testing).
 *
 * @returns {string} Absolute path to audit-log.json
 */
function getAuditLogPath() {
  return AUDIT_LOG_PATH;
}

module.exports = {
  saveAudit,
  getAuditLogPath,
  // Export for testing
  ensureFileExists,
  readAuditLog,
};
