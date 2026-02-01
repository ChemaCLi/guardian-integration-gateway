## ADDED Requirements

### Requirement: Endpoint accepts valid inquiry request

The system SHALL expose POST /secure-inquiry that accepts a JSON body with `userId` (string) and `message` (string). The route MUST validate that both fields are present and non-empty strings before delegating to the use case.

#### Scenario: Valid request returns answer

- **WHEN** client sends POST /secure-inquiry with body `{ "userId": "user-1", "message": "Hello" }`
- **THEN** system returns HTTP 200 with body `{ "answer": "<AI-generated answer>" }`

#### Scenario: Missing userId returns 400

- **WHEN** client sends POST /secure-inquiry with body `{ "message": "Hello" }` (no userId)
- **THEN** system returns HTTP 400

#### Scenario: Missing or empty message returns 400

- **WHEN** client sends POST /secure-inquiry with body `{ "userId": "user-1", "message": "" }` or missing message
- **THEN** system returns HTTP 400

### Requirement: Inquiry flow orchestrates sanitize then AI then audit

The use case SHALL execute in order: (1) if circuit is open, return "Service Busy" without calling AI or audit; (2) sanitize the message; (3) call AI with sanitized message only; (4) on AI success, record success, save audit entry (encrypted original + plaintext sanitized), return answer; (5) on AI failure, record failure and return or propagate error. The original (unsanitized) message MUST NOT be sent to the AI provider.

#### Scenario: Successful flow returns answer and writes audit

- **WHEN** circuit is closed, request is valid, AI call succeeds
- **THEN** response is 200 with answer, and one audit entry is written with userId, timestamp, encrypted original message, and plaintext sanitized message

#### Scenario: Circuit open returns Service Busy without calling AI

- **WHEN** circuit is open
- **THEN** system returns HTTP 503 with body `{ "error": "Service Busy" }` without calling the AI adapter or writing audit for that request

#### Scenario: Only sanitized message is sent to AI

- **WHEN** message contains PII (e.g. email) and flow runs
- **THEN** the string passed to the AI provider contains `<REDACTED: EMAIL>` (or equivalent) and never the raw PII

### Requirement: Audit entry on success only

On successful AI response, the system SHALL write one audit entry containing at least userId, timestamp, encrypted original message, and plaintext sanitized message. On AI failure or when circuit is open, the system MUST NOT write an audit entry for that request.

#### Scenario: Audit written on success

- **WHEN** AI call resolves successfully
- **THEN** audit storage receives one entry with originalMessageEncrypted and sanitizedMessage

#### Scenario: No audit when circuit is open

- **WHEN** circuit is open and client sends valid request
- **THEN** no audit entry is written for that request

#### Scenario: No audit when AI fails

- **WHEN** AI call rejects or throws
- **THEN** no audit entry is written for that request
