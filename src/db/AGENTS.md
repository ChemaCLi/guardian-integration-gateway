# DB Layer — Guardian Integration Gateway

This layer is the **data storage location** for the mock audit log. It is a directory where the audit adapter persists entries.

---

## Purpose

- Host the `audit-log.json` file used by `jsonAudit.adapter.js`
- Define the expected schema of stored data
- Document file creation and structure for AI agents

---

## Rules for AI Agents

1. **Do not put business logic here** — this is a data location, not a service
2. **The audit adapter** (`jsonAudit.adapter.js`) is responsible for reading/writing
3. **Create the file if missing** — adapter should ensure `audit-log.json` exists before first append
4. **Use relative paths** from project root: `src/db/audit-log.json`

---

## File Structure

```
src/db/
├── audit-log.json    # JSON array of audit entries (created by adapter if missing)
└── AGENTS.md         # This file
```

---

## Audit Log Schema

**File:** `audit-log.json`  
**Format:** JSON array of objects

```json
[
  {
    "userId": "string",
    "originalEncrypted": "string",
    "redactedMessage": "string",
    "timestamp": "2025-01-31T12:00:00.000Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User identifier from request |
| `originalEncrypted` | string | Original message encrypted (AES) |
| `redactedMessage` | string | Sanitized message in plaintext |
| `timestamp` | string | ISO 8601 timestamp |

---

## Notes

- **Initial state:** Empty array `[]` or file created on first write
- **Concurrency:** Single-process app; no locking required for dev mock
- **Persistence:** File persists across restarts; no in-memory store
- **Backup/retention:** Out of scope for mock; document if production DB is added

---

*This is the data home; the adapter owns read/write logic.*
