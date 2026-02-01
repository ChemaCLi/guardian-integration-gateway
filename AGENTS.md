# AGENTS.md — Guardian Integration Gateway

This file provides AI agents and developers with architectural context, code rules, and patterns to follow when implementing or modifying the Guardian Integration Gateway project.

---

## 1. Architecture Overview

### 1.1 Hexagonal Architecture (Ports & Adapters)

The project uses **Hexagonal Architecture** to keep core business logic independent of external systems.

| Layer | Purpose |
|-------|---------|
| **Routes** | Handle HTTP, validate request shape, delegate to use cases |
| **Core (Use Cases)** | Orchestrate the business flow; depend only on **ports** (interfaces) |
| **Ports** | Abstract interfaces defining contracts (e.g., `generateAnswer(message)`, `saveAudit(entry)`) |
| **Adapters** | Concrete implementations of ports (mock AI, JSON audit DB, real AI provider) |
| **Services** | Pure domain logic (sanitization, circuit breaker); no I/O to external systems |

**Rule:** Core and use cases must never import adapters or infrastructure directly. Dependencies flow inward: adapters implement ports; use cases depend on ports.

### 1.2 Dependency Flow

```
Routes → Use Cases → Ports ← Adapters
              ↓
         Services (sanitizer, circuitBreaker)
```

### 1.3 File Responsibilities

| File | Responsibility |
|------|----------------|
| `index.js` | Bootstrap server, load config, start listening |
| `app.js` | Express setup, middleware, mount routes |
| `secureInquiry.route.js` | Parse `userId` and `message`, call use case, format HTTP response |
| `secureInquiry.usecase.js` | Orchestrate: sanitize → call AI (via port) → audit (via port). Integrate circuit breaker |
| `ai.port.js` | Define interface for AI (e.g., `generateAnswer(message) -> answer`) |
| `auditDb.port.js` | Define interface for audit storage (e.g., `saveAudit(entry)`) |
| `sanitizer.service.js` | Redact emails, credit cards, SSNs; return sanitized string |
| `circuitBreaker.service.js` | Track failures, expose `isOpen()`, `recordFailure()`, `recordSuccess()` |
| `mockAI.adapter.js` | Implement AI port with 2s delay, return "Generated Answer" |
| `jsonAudit.adapter.js` | Implement audit port, append to `audit-log.json` |
| `ai.factory.js` | Return the configured AI adapter instance |
| `db.factory.js` | Return the configured audit DB adapter instance |
| `crypto.util.js` | `encrypt(text)` and `decrypt(cipher)` for original message storage |

---

## 2. Code Rules

### 2.1 Use Adapters for External Services

**Rule:** Any interaction with an external system (AI API, database, file system for audit) must go through a **port** and an **adapter**.

- Do **not** call external APIs, read/write files, or access databases directly from use cases or services.
- Define the contract in a port (e.g., `ai.port.js`).
- Implement the contract in an adapter (e.g., `mockAI.adapter.js`).
- Use factories (e.g., `ai.factory.js`) to resolve the adapter at runtime.

**Rationale:** This allows swapping implementations (mock vs real) without touching core logic.

### 2.2 JSDoc for All Public Functions

**Rule:** Every exported function must have a JSDoc block describing:

- Purpose (brief description)
- `@param` for each argument with type and description
- `@returns` with type and description
- `@throws` if the function can throw

**Example:**
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

This provides input/output typing and improves editor support even without TypeScript.

### 2.3 Prefer Readability Over Elegance

**Rule:** Write explicit, step-by-step code. Avoid chained or nested patterns that reduce readability.

**Avoid:**
```javascript
const result = process(getData()).transform(applyRules).validate().finalize();
```

**Prefer:**
```javascript
const raw = getData();
const processed = process(raw);
const transformed = applyRules(processed);
const validated = validate(transformed);
const result = finalize(validated);
```

- Use intermediate variables with clear names.
- Prefer multiple simple statements over one complex expression.
- Avoid excessive nesting; extract into named functions when logic becomes deep.

### 2.4 Single Responsibility

- Each file should have one clear responsibility.
- Each function should do one thing.
- If a function grows beyond ~20–30 lines, consider splitting it.

### 2.5 Error Handling

- Use meaningful error messages.
- Let the route layer handle HTTP status codes (e.g., 503 when circuit breaker is open).
- Avoid swallowing errors; propagate or log them appropriately.

---

## 3. Patterns to Respect

### 3.1 Port Definition Pattern

Ports are **abstract contracts**, typically expressed as objects with function references or as documentation that adapters must satisfy. Example:

```javascript
/**
 * AI Port — Contract for AI providers
 *
 * Implementations must provide:
 * - generateAnswer(sanitizedMessage: string): Promise<string>
 *   Resolves with the AI-generated answer or rejects on failure.
 */
```

Adapters implement this contract. Use cases receive the port implementation via dependency injection or factory.

### 3.2 Adapter Pattern

- Adapters live under `infrastructure/`.
- Each adapter implements exactly one port.
- Adapters may use utilities (e.g., `crypto.util.js`) for low-level operations.

### 3.3 Factory Pattern

- `ai.factory.js` returns the AI adapter (e.g., `mockAI` for now).
- `db.factory.js` returns the audit DB adapter (e.g., `jsonAudit`).
- Factories centralize configuration and make it easy to swap implementations.

### 3.4 Circuit Breaker Pattern

- **States:** Closed (normal) → Open (after 3 consecutive failures) → Half-open (optional, for recovery).
- When **open**, the API returns "Service Busy" immediately without calling the AI adapter.
- `recordSuccess()` resets the failure count.
- `recordFailure()` increments it; at 3, the circuit opens.

---

## 4. Data Types (PII Redaction)

| Type | Detection | Replacement |
|------|-----------|-------------|
| Email | RFC-style email regex | `<REDACTED: EMAIL>` |
| Credit Card | 13–19 digits, Luhn valid | `<REDACTED: CREDIT_CARD>` |
| SSN | 9 consecutive digits | `<REDACTED: SSN>` |

---

## 5. Endpoint Contract

- **POST** `/secure-inquiry`
- **Request:** `{ userId: string, message: string }`
- **Success (200):** `{ answer: string }`
- **Circuit breaker open (503):** `{ error: "Service Busy" }`

---

## 6. Implementation Notes

- Use **Mock AI** first: `setTimeout` 2 seconds, then resolve with `"Generated Answer"`.
- Audit DB: append entries to `src/db/audit-log.json` (ensure file exists; create if missing).
- Encryption: use a simple approach (e.g., AES) for the original message; key from config/env.

---

## 7. Layer-Specific AGENTS.md

Each module has its own AGENTS.md with focused context for AI agents:

| Layer | Path | Purpose |
|-------|------|---------|
| Routes | `src/routes/AGENTS.md` | HTTP handling, validation, response mapping |
| Use Cases | `src/usecases/AGENTS.md` | Orchestration, flow, port integration |
| Ports | `src/ports/AGENTS.md` | Contract definitions (AI, audit DB) |
| Services | `src/services/AGENTS.md` | Sanitizer, circuit breaker; pure logic |
| Infrastructure | `src/infrastructure/AGENTS.md` | Adapters, factories, crypto |
| DB | `src/db/AGENTS.md` | Audit log schema, data storage location |
| Utils | `src/utils/AGENTS.md` | Shared utilities |

When implementing or modifying a module, read its layer AGENTS.md for module-specific rules and responsibilities.

---

*This document should be updated when architecture or patterns change.*
