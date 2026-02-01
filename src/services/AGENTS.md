# Services Layer — Guardian Integration Gateway

This layer contains **pure domain logic** with no I/O to external systems. Services are called by use cases and have no dependencies on ports or adapters.

---

## Purpose

- Implement reusable business rules (sanitization, circuit breaker state)
- Be **deterministic and testable** (no network, no file system)
- Stay free of infrastructure concerns

---

## Rules for AI Agents

1. **No external I/O** — no HTTP, file reads/writes, database calls
2. **JSDoc on all exports** — `@param`, `@returns`, `@throws`
3. **Prefer readability** — explicit steps, clear variable names
4. **Single responsibility** — one file, one concern

---

## Services to Implement

### Sanitizer Service (`sanitizer.service.js`)

**Redacts PII from messages before sending to AI.**

| Type | Detection | Replacement |
|------|-----------|-------------|
| Email | RFC-style email regex | `<REDACTED: EMAIL>` |
| Credit Card | 13–19 digits, Luhn-valid | `<REDACTED: CREDIT_CARD>` |
| SSN | 9 consecutive digits | `<REDACTED: SSN>` |

**Exported function:**
- `sanitize(message: string) => string`

**Order of redaction:** Process in a consistent order (e.g., email first, then credit card, then SSN) to avoid overlap.

---

### Circuit Breaker Service (`circuitBreaker.service.js`)

**Tracks AI call failures; opens after 3 consecutive failures.**

| Method | Signature | Description |
|--------|-----------|-------------|
| `isOpen` | `() => boolean` | Returns `true` when circuit is open (fail fast) |
| `recordFailure` | `() => void` | Increments failure count; opens circuit at 3 |
| `recordSuccess` | `() => void` | Resets failure count to 0 |

**States:**
- **Closed:** Normal operation, AI calls allowed
- **Open:** After 3 consecutive failures; `isOpen()` returns `true`, API returns "Service Busy" immediately

**Note:** Half-open state (optional recovery) may be added later.

---

## File Structure

```
src/services/
├── sanitizer.service.js      # PII redaction
├── circuitBreaker.service.js # Failure tracking
└── AGENTS.md                 # This file
```

---

## Luhn Algorithm (Credit Cards)

Credit card detection must use **Luhn validation** to avoid false positives. Only numbers that pass Luhn are redacted as credit cards.

---

## JSDoc Example

```javascript
/**
 * Sanitizes a message by replacing sensitive data with redaction placeholders.
 *
 * @param {string} message - Raw user message potentially containing PII
 * @returns {string} Sanitized message with emails, credit cards, and SSNs replaced by <REDACTED: TYPE>
 */
function sanitize(message) {
  // ...
}
```

---

*Services are pure logic; no ports, no adapters.*
