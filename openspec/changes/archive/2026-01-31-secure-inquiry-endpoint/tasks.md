## 1. Ports (Contracts)

- [x] 1.1 Create `src/ports/ai.port.js` with contract for `generateAnswer(sanitizedMessage)` returning Promise&lt;string&gt;
- [x] 1.2 Create `src/ports/auditDb.port.js` with contract for `saveAudit(entry)` (entry: userId, timestamp, originalMessageEncrypted, sanitizedMessage)

## 2. Sanitizer Service

- [x] 2.1 Implement `src/services/sanitizer.service.js` with `sanitize(message)` — redact emails to `<REDACTED: EMAIL>`
- [x] 2.2 Add SSN redaction (9 consecutive digits) to `<REDACTED: SSN>`
- [x] 2.3 Add credit card redaction (13–19 digits, Luhn valid) to `<REDACTED: CREDIT_CARD>`
- [x] 2.4 Add unit tests for sanitizer (use `/unit-test-writer`; cover email, SSN, credit card, multiple PII, empty, no PII)
- [x] 2.5 Run `/check-unit-tests` for sanitizer and commit with `/git-commiter`

## 3. Circuit Breaker Service

- [x] 3.1 Implement `src/services/circuitBreaker.service.js` with `isOpen()`, `recordFailure()`, `recordSuccess()`
- [x] 3.2 Ensure circuit opens after 3 consecutive failures and resets on recordSuccess()
- [x] 3.3 Add unit tests for circuit breaker (use `/unit-test-writer`; cover closed, open after 3 failures, reset on success)
- [x] 3.4 Run `/check-unit-tests` for circuit breaker and commit with `/git-commiter`
- [x] 3.5 Run `/check-stability` after services layer

## 4. Crypto Utility

- [x] 4.1 Implement `src/utils/crypto.util.js` with `encrypt(text)` and `decrypt(cipher)` using AES; key from config/env
- [x] 4.2 Add unit tests for crypto (use `/unit-test-writer`; round-trip, empty string)
- [x] 4.3 Run `/check-unit-tests` for crypto and commit with `/git-commiter`

## 5. Mock AI Adapter

- [x] 5.1 Implement `src/infrastructure/adapters/mockAI.adapter.js` implementing AI port — 2s delay then resolve with "Generated Answer"
- [x] 5.2 Add unit tests for mock AI (use `/unit-test-writer`; delay, return value)
- [x] 5.3 Run `/check-unit-tests` for mock AI and commit with `/git-commiter`

## 6. JSON Audit Adapter

- [x] 6.1 Implement `src/infrastructure/adapters/jsonAudit.adapter.js` implementing audit port — append to JSON file (create file if missing)
- [x] 6.2 Audit entry shape: userId, timestamp, originalMessageEncrypted, sanitizedMessage
- [x] 6.3 Add unit tests for jsonAudit (use `/unit-test-writer`; append entry, file creation)
- [x] 6.4 Run `/check-unit-tests` for jsonAudit and commit with `/git-commiter`
- [x] 6.5 Run `/check-stability` after infrastructure layer

## 7. Factories

- [x] 7.1 Create `src/infrastructure/ai.factory.js` returning configured AI adapter (mock for now)
- [x] 7.2 Create `src/infrastructure/db.factory.js` returning configured audit DB adapter (JSON for now)
- [x] 7.3 Ensure audit log path and encryption key come from config/env; create `src/db/audit-log.json` or ensure path writable

## 8. Secure Inquiry Use Case

- [x] 8.1 Implement `src/usecases/secureInquiry.usecase.js` — accept (userId, message, aiPort, auditDbPort, circuitBreaker, sanitizer)
- [x] 8.2 Flow: if circuit is open return "Service Busy"; sanitize message; call AI with sanitized message; on success recordSuccess, encrypt original, saveAudit, return answer; on failure recordFailure, rethrow
- [x] 8.3 Add unit tests for use case (use `/unit-test-writer`; circuit open, success path, failure path, audit on success only)
- [x] 8.4 Run `/check-unit-tests` for use case and commit with `/git-commiter`

## 9. Route and App Wiring

- [x] 9.1 Create `src/routes/secureInquiry.route.js` — POST handler, validate body has userId and message (non-empty strings), 400 if invalid
- [x] 9.2 Call use case with adapters from factories; return 200 with `{ answer }` on success, 503 with `{ error: "Service Busy" }` when circuit open, 500 on other errors
- [x] 9.3 Mount POST /secure-inquiry in `app.js` with JSON body parser
- [x] 9.4 Run `/check-stability` and verify endpoint with manual or integration test
- [x] 9.5 Commit route and app changes with `/git-commiter`

## 10. Final Verification

- [x] 10.1 Run full test suite and `/check-stability`
- [x] 10.2 Verify circuit breaker: trigger 3 failures (e.g. failing mock), confirm 503 "Service Busy" without timeout
- [x] 10.3 Verify audit log contains encrypted original and plaintext sanitized message for successful requests
