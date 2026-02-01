/**
 * JSON Audit Adapter — Implements Audit DB port using a JSON file
 *
 * Appends audit entries to src/db/audit-log.json.
 * Creates the file if it doesn't exist.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuditDbPort, AuditEntry } from '../../ports/auditDb.port';

/** Path to the audit log file */
const AUDIT_LOG_PATH = path.join(__dirname, '../../db/audit-log.json');

/**
 * JSON file audit adapter that extends AuditDbPort.
 */
export class JsonAuditAdapter extends AuditDbPort {
  /**
   * Ensures the audit log file exists.
   * Creates an empty array if the file doesn't exist.
   */
  ensureFileExists(): void {
    const dir = path.dirname(AUDIT_LOG_PATH);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      fs.writeFileSync(AUDIT_LOG_PATH, '[]', 'utf8');
    }
  }

  /**
   * Reads the current audit log entries.
   *
   * @returns Array of audit entries
   */
  readAuditLog(): AuditEntry[] {
    this.ensureFileExists();

    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');

    try {
      return JSON.parse(content) as AuditEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Writes entries to the audit log file.
   *
   * @param entries - Array of audit entries to write
   */
  writeAuditLog(entries: AuditEntry[]): void {
    const content = JSON.stringify(entries, null, 2);
    fs.writeFileSync(AUDIT_LOG_PATH, content, 'utf8');
  }

  /**
   * Saves an audit entry to the JSON file.
   *
   * @param entry - Audit entry to save
   * @returns Resolves when entry is written
   */
  saveAudit(entry: AuditEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const entries = this.readAuditLog();
        entries.push(entry);
        this.writeAuditLog(entries);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Gets the audit log file path (for testing).
   *
   * @returns Absolute path to audit-log.json
   */
  getAuditLogPath(): string {
    return AUDIT_LOG_PATH;
  }
}

export { AUDIT_LOG_PATH };
