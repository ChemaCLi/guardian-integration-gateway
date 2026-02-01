# Ports Layer — Guardian Integration Gateway

This layer defines **abstract contracts** (interfaces) that external systems must satisfy. Ports are the boundaries between core business logic and infrastructure. Use cases depend on ports, never on adapters.

---

## Purpose

- Define the **contract** (method signatures, input/output shape) for external capabilities
- Allow swapping implementations (mock vs real) without changing core logic
- Keep use cases and services **infrastructure-agnostic**

---

## Rules for AI Agents

1. **Never import adapters or infrastructure** in this layer
2. **Document the full contract** in JSDoc: parameters, return types, errors
3. Ports are **documentation + conventions**; adapters implement them
4. Do not add business logic; ports only describe *what* is needed, not *how*

---

## Ports to Implement

### AI Port (`ai.port.js`)

**Contract for AI providers.**

| Method | Signature | Description |
|--------|-----------|-------------|
| `generateAnswer` | `(sanitizedMessage: string) => Promise<string>` | Sends the sanitized message to an AI backend; resolves with the answer or rejects on failure |

**Adapters implementing this port:**
- `mockAI.adapter.js` — Mock with 2s delay, returns `"Generated Answer"`

---

### Audit DB Port (`auditDb.port.js`)

**Contract for audit storage.**

| Method | Signature | Description |
|--------|-----------|-------------|
| `saveAudit` | `(entry: AuditEntry) => Promise<void>` | Persists an audit entry; resolves when written, rejects on failure |

**Audit entry shape:**
```javascript
{
  userId: string,
  originalEncrypted: string,   // Encrypted original message
  redactedMessage: string,    // Plaintext sanitized message
  timestamp: string           // ISO 8601
}
```

**Adapters implementing this port:**
- `jsonAudit.adapter.js` — Appends to `audit-log.json`

---

## File Structure

```
src/ports/
├── ai.port.js          # AI provider contract
├── auditDb.port.js     # Audit storage contract
└── AGENTS.md           # This file
```

---

## JSDoc Example for a Port

```javascript
/**
 * AI Port — Contract for AI providers
 *
 * Implementations must provide:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 *   Resolves with the AI-generated answer.
 *   Rejects on network error, timeout, or API failure.
 *
 * @typedef {Object} AIPort
 * @property {function(string): Promise<string>} generateAnswer
 */
```

---

*Ports define *what*; adapters define *how*.*
