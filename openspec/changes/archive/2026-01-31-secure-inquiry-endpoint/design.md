## Context

The Guardian Integration Gateway project uses **Hexagonal Architecture** (ports and adapters). There is no existing secure-inquiry endpoint; this is a greenfield addition. The project already defines conventions in AGENTS.md: routes handle HTTP, use cases orchestrate business flow and depend only on ports, services contain pure domain logic (no I/O), and adapters implement ports. Express and Node.js crypto are available. Stakeholders need PII protection before sending user messages to AI providers and an encrypted audit trail for compliance.

## Goals / Non-Goals

**Goals:**

- Implement POST /secure-inquiry with request validation and response mapping.
- Sanitize PII (emails, credit cards, SSNs) before any AI call; replace with `<REDACTED: TYPE>`.
- Call AI via a port/adapter (mock adapter with 2s delay initially).
- Persist original message (encrypted) and sanitized message (plaintext) in an audit store (JSON file initially).
- Apply a circuit breaker: after 3 consecutive AI failures, return "Service Busy" (503) without calling AI.
- Keep core logic independent of infrastructure; all external I/O through ports and adapters.
- Ensure every main component has unit tests and that stability checks and commits follow the change workflow.

**Non-Goals:**

- Real AI provider integration (mock only for this change).
- Real database for audit (JSON file only).
- Half-open circuit state or automatic recovery; circuit opens after 3 failures and remains open until explicitly reset or process restart (unless we add half-open later).
- Rate limiting, authentication, or authorization (out of scope for this change).
- Decryption or audit query API (storage only).

## Decisions

### 1. Use ports for AI and audit storage

**Decision:** Define `ai.port.js` (e.g. `generateAnswer(sanitizedMessage)`) and `auditDb.port.js` (e.g. `saveAudit(entry)`). Use cases depend only on these contracts; adapters implement them.

**Rationale:** Keeps use cases testable without real AI or DB, and allows swapping mock vs real implementations via factories. Aligns with existing AGENTS.md.

**Alternatives considered:** Calling AI/DB directly from use case (rejected: breaks hexagonal boundary and testability).

### 2. Sanitizer and circuit breaker as in-process services

**Decision:** Implement sanitizer and circuit breaker as plain JS modules (services) with no I/O. Use case calls `sanitize(message)` and uses circuit breaker’s `isOpen()`, `recordFailure()`, `recordSuccess()`.

**Rationale:** Pure logic is easy to unit test and fits “services = domain logic” in AGENTS.md. Circuit state is in-memory; acceptable for single-process deployment.

**Alternatives considered:** External circuit breaker service (rejected: unnecessary for current scale).

### 3. Audit entry shape and encryption scope

**Decision:** Audit entry contains at least: `userId`, `timestamp`, `originalMessageEncrypted`, `sanitizedMessage` (plaintext). Only the original message is encrypted; sanitized message and metadata remain plaintext for search/debugging.

**Rationale:** Minimizes exposure of raw PII while keeping redacted content usable. Encryption key from config/env (e.g. AES).

**Alternatives considered:** Encrypt entire entry (rejected: complicates querying); store original in plaintext (rejected: compliance risk).

### 4. Circuit breaker: open after 3 consecutive failures, no half-open in v1

**Decision:** Circuit has closed/open. On 3 consecutive AI call failures, set open. When open, use case returns “Service Busy” immediately without calling AI. `recordSuccess()` resets failure count (closes circuit). No automatic half-open or time-based recovery in this change.

**Rationale:** Simple to implement and test; meets “fail 3 times → instant Service Busy” requirement. Half-open can be added later if needed.

**Alternatives considered:** Half-open with retry (deferred to keep first version small).

### 5. Factories resolve adapters at startup/request time

**Decision:** `ai.factory.js` and `db.factory.js` return the configured adapter instance (e.g. mock AI, JSON audit). Route or app wiring calls factories and injects adapters into use case.

**Rationale:** Single place to swap implementations; no adapter imports in use case or routes.

**Alternatives considered:** Hard-coding adapter in use case (rejected: violates dependency inversion).

### 6. Order of operations in use case

**Decision:** 1) If circuit is open → return “Service Busy” (no sanitization, no AI, no audit for that request). 2) Sanitize message. 3) Call AI with sanitized message. 4) On success: record success, write audit (encrypted original + sanitized), return answer. 5) On AI failure: record failure, rethrow or return error; do not write audit for failed AI calls (optional: we could audit failures with a flag; for simplicity, audit only on success).

**Rationale:** Avoids sending PII to AI and avoids unnecessary work when circuit is open. Audit only on success keeps audit log meaning clear; failures can be added later if required.

**Alternatives considered:** Audit on failure too (acceptable future enhancement).

### 7. Request validation and HTTP status

**Decision:** Route validates body has `userId` and `message` (non-empty strings). Invalid request → 400. Circuit open → 503 with `{ error: "Service Busy" }`. AI or audit failure → 500 (or 503 if we reserve 503 for circuit only; proposal says 503 for “Service Busy”, so other errors can be 500).

**Rationale:** Clear contract for clients; 503 reserved for circuit open as per proposal.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| PII leaks if sanitizer misses a pattern | Unit tests for emails, SSNs, credit cards (including Luhn); add more patterns in sanitizer over time. |
| Audit file grows unbounded | Out of scope for this change; document that log rotation or archival is a future task. |
| Single process: circuit state lost on restart | Acceptable for v1; circuit resets on deploy. Distributed circuit would require shared state. |
| Encryption key in env | Document that key must be kept secret and rotated; no key in code or repo. |
| Mock AI always succeeds: circuit hard to test | Unit test circuit breaker in isolation; optional integration test could use a “failing” mock adapter. |

## Migration Plan

- **Deploy:** Add new route and dependencies; no existing endpoint removed. Feature flag not required for initial rollout.
- **Rollback:** Remove or disable POST /secure-inquiry route and redeploy; no data migration.
- **Config:** Ensure `AUDIT_LOG_PATH` (or equivalent) and encryption key env vars are set; create or ensure `audit-log.json` path is writable.

## Open Questions

- **Audit on AI failure:** Should we write an audit entry when the AI call fails (e.g. with a `success: false` flag)? Currently design assumes audit only on success.
- **Circuit reset:** Should the circuit ever auto-close after a cooldown (half-open), or is manual/restart-only acceptable for the foreseeable future?
- **Validation:** Should `userId` or `message` have max length or format constraints beyond “non-empty string”?
