# Use Cases Layer — Guardian Integration Gateway

This layer **orchestrates the business flow**. Use cases depend only on **ports** (interfaces) and **services**; they never import adapters or infrastructure.

---

## Purpose

- Implement the 3-step flow: Sanitization → AI Call → Audit Log
- Integrate circuit breaker (fail fast when open)
- Keep core logic independent of external systems

---

## Rules for AI Agents

1. **Depend on ports, not adapters** — receive AI and audit implementations via parameters or factory
2. **Call services** (sanitizer, circuit breaker) for pure logic
3. **No HTTP, no file I/O** — all external access goes through ports
4. **Explicit flow** — use clear variable names and step-by-step logic

---

## Secure Inquiry Use Case (`secureInquiry.usecase.js`)

**Flow:**

1. **Sanitize** — Call `sanitize(message)` from sanitizer service; get redacted message
2. **Check circuit breaker** — If `isOpen()` is true, return `{ answer: null, circuitOpen: true }` (or similar; route maps to 503)
3. **Call AI** — Call `aiPort.generateAnswer(sanitizedMessage)`; on success, `recordSuccess()`; on failure, `recordFailure()` and rethrow
4. **Audit** — Encrypt original message; call `auditDbPort.saveAudit({ userId, originalEncrypted, redactedMessage, timestamp })`
5. **Return** — `{ answer }` for success

**Input:** `{ userId: string, message: string }`  
**Output:** `{ answer: string }` or `{ circuitOpen: true }` (or equivalent for route to interpret)

---

## Dependency Injection

Use case should receive:

- `sanitizer` (service)
- `circuitBreaker` (service)
- `aiPort` (from factory or DI)
- `auditDbPort` (from factory or DI)
- `cryptoUtil` or `encrypt` function (for original message)

Alternatively, factories can be called inside the use case if that keeps the route thin. Prefer **explicit dependencies** for testability.

---

## Error Handling

- **Circuit open:** Return immediately with `circuitOpen: true`; no AI call
- **AI failure:** Call `recordFailure()`, then propagate error to route (route may return 500 or 503)
- **Audit failure:** Log and/or propagate; decide whether to fail the request or continue (per product requirements)

---

## File Structure

```
src/usecases/
├── secureInquiry.usecase.js   # Orchestrates sanitize → AI → audit
└── AGENTS.md                  # This file
```

---

## JSDoc Example

```javascript
/**
 * Processes a secure inquiry: sanitizes message, calls AI, audits the request.
 *
 * @param {Object} params
 * @param {string} params.userId - User identifier
 * @param {string} params.message - Raw user message (may contain PII)
 * @returns {Promise<{answer: string}|{circuitOpen: boolean}>} AI answer or circuit-open indicator
 * @throws {Error} On AI or audit failure (when not circuit-open)
 */
async function executeSecureInquiry(params) {
  // ...
}
```

---

*Use cases orchestrate; they do not implement.*
