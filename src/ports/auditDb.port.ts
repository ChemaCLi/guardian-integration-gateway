/**
 * Audit DB Port — Abstract contract for audit storage
 *
 * This port defines the interface that any audit storage adapter must implement.
 * Use cases depend on this contract, never on specific adapters.
 *
 * Subclasses must implement:
 * - saveAudit(entry: AuditEntry): Promise<void>
 */

export interface AuditEntry {
  userId: string;
  timestamp: string;
  originalMessageEncrypted: string;
  sanitizedMessage: string;
}

export abstract class AuditDbPort {
  /**
   * Saves an audit entry to the storage backend.
   * Must be implemented by adapters.
   *
   * @param entry - The audit entry to persist
   * @returns Resolves when written successfully
   * @throws Rejects on write failure
   */
  abstract saveAudit(entry: AuditEntry): Promise<void>;
}
