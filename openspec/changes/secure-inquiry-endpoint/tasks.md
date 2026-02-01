## 1. Ports (Contracts)

- [ ] 1.1 Create `src/ports/ai.port.js` with contract for `generateAnswer(sanitizedMessage)` returning Promise&lt;string&gt;
- [ ] 1.2 Create `src/ports/auditDb.port.js` with contract for `saveAudit(entry)` (entry: userId, timestamp, originalMessageEncrypted, sanitizedMessage)

## 2. Sanitizer Service

- [ ] 2.1 Implement `src/services/sanitizer.service.js` with `sanitize(message)` — redact emails to `<REDACTED: EMAIL>`
- [ ] 2.2 Add SSN redaction (9 consecutive digits) to `<REDACTED: SSN>`
- [ ] 2.3 Add credit card redaction (13–19 digits, Luhn valid) to `<REDACTED: CREDIT_CARD>`
- [ ] 2.4 Add unit tests for sanitizer (use `/unit-test-writer`; cover email, SSN, credit card, multiple PII, empty, no PII)
- [ ] 2.5 Run `/check-unit-tests` for sanitizer and commit with `/git-commiter`

## 3. Circuit Breaker Service

- [ ] 3.1 Implement `src/services/circuitBreaker.service.js` with `isOpen()`, `recordFailure()`, `recordSuccess()`
- [ ] 3.2 Ensure circuit opens after 3 consecutive failures and resets on recordSuccess()
- [ ] 3.3 Add unit tests for circuit breaker (use `/unit-test-writer`; cover closed, open after 3 failures, reset on success)
- [ ] 3.4 Run `/check-unit-tests` for circuit breaker and commit with `/git-commiter`
- [ ] 3.5 Run `/check-stability` after services layer

## 4. Crypto Utility

- [ ] 4.1 Implement `src/utils/crypto.util.js` with `encrypt(text)` and `decrypt(cipher)` using AES; key from config/env
- [ ] 4.2 Add unit tests for crypto (use `/unit-test-writer`; round-trip, empty string)
- [ ] 4.3 Run `/check-unit-tests` for crypto and commit with `/git-commiter`

## 5. Mock AI Adapter

- [ ] 5.1 Implement `src/infrastructure/adapters/mockAI.adapter.js` implementing AI port — 2s delay then resolve with "Generated Answer"
- [ ] 5.2 Add unit tests for mock AI (use `/unit-test-writer`; delay, return value)
- [ ] 5.3 Run `/check-unit-tests` for mock AI and commit with `/git-commiter`

## 6. JSON Audit Adapter

- [ ] 6.1 Implement `src/infrastructure/adapters/jsonAudit.adapter.js` implementing audit port — append to JSON file (create file if missing)
- [ ] 6.2 Audit entry shape: userId, timestamp, originalMessageEncrypted, sanitizedMessage
- [ ] 6.3 Add unit tests for jsonAudit (use `/unit-test-writer`; append entry, file creation)
- [ ] 6.4 Run `/check-unit-tests` for jsonAudit and commit with `/git-commiter`
- [ ] 6.5 Run `/check-stability` after infrastructure layer

## 7. Factories

- [ ] 7.1 Create `src/infrastructure/ai.factory.js` returning configured AI adapter (mock for now)
- [ ] 7.2 Create `src/infrastructure/db.factory.js` returning configured audit DB adapter (JSON for now)
- [ ] 7.3 Ensure audit log path and encryption key come from config/env; create `src/db/audit-log.json` or ensure path writable

## 8. Secure Inquiry Use Case

- [ ] 8.1 Implement `src/usecases/secureInquiry.usecase.js` — accept (userId, message, aiPort, auditDbPort, circuitBreaker, sanitizer)
- [ ] 8.2 Flow: if circuit is open return "Service Busy"; sanitize message; call AI with sanitized message; on success recordSuccess, encrypt original, saveAudit, return answer; on failure recordFailure, rethrow
- [ ] 8.3 Add unit tests for use case (use `/unit-test-writer`; circuit open, success path, failure path, audit on success only)
- [ ] 8.4 Run `/check-unit-tests` for use case and commit with `/git-commiter`

## 9. Route and App Wiring

- [ ] 9.1 Create `src/routes/secureInquiry.route.js` — POST handler, validate body has userId and message (non-empty strings), 400 if invalid
- [ ] 9.2 Call use case with adapters from factories; return 200 with `{ answer }` on success, 503 with `{ error: "Service Busy" }` when circuit open, 500 on other errors
- [ ] 9.3 Mount POST /secure-inquiry in `app.js` with JSON body parser
- [ ] 9.4 Run `/check-stability` and verify endpoint with manual or integration test
- [ ] 9.5 Commit route and app changes with `/git-commiter`

## 10. Final Verification

- [ ] 10.1 Run full test suite and `/check-stability`
- [ ] 10.2 Verify circuit breaker: trigger 3 failures (e.g. failing mock), confirm 503 "Service Busy" without timeout
- [ ] 10.3 Verify audit log contains encrypted original and plaintext sanitized message for successful requests
