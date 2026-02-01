## Why

User messages sent to AI systems may contain sensitive personal information (PII) such as email addresses, credit card numbers, and Social Security Numbers. Sharing this data with public LLMs creates privacy and compliance risks. We need a secure endpoint that sanitizes user input before forwarding it to AI providers, while maintaining an encrypted audit trail of original messages for compliance and debugging purposes.

## What Changes

- Add a new **POST /secure-inquiry** endpoint that accepts `{ userId: string, message: string }`
- Implement a **PII sanitizer** that detects and redacts emails, credit cards, and SSNs from messages
- Integrate with an **AI provider** via ports/adapters pattern (mock adapter initially with 2s delay)
- Create an **audit logging system** that stores encrypted original messages alongside sanitized versions
- Implement a **circuit breaker** pattern to gracefully handle AI provider failures (returns "Service Busy" after 3 consecutive failures)

## Capabilities

### New Capabilities

- `secure-inquiry`: Main endpoint orchestrating the sanitize → AI call → audit flow. Defines the HTTP contract, request validation, and response format including error states (503 for circuit breaker open).
- `pii-sanitization`: Service that detects and redacts PII from text. Handles emails (RFC-style), credit cards (13-19 digits with Luhn validation), and SSNs (9 consecutive digits). Replaces with `<REDACTED: TYPE>` placeholders.
- `circuit-breaker`: Resilience pattern that tracks consecutive AI call failures. Opens after 3 failures to fail-fast with "Service Busy" response. Resets on success.

### Modified Capabilities

<!-- No existing capabilities to modify - this is a greenfield implementation -->

## Impact

**New Files (following hexagonal architecture):**
- `src/routes/secureInquiry.route.js` - HTTP handling, validation, response mapping
- `src/usecases/secureInquiry.usecase.js` - Orchestration logic
- `src/ports/ai.port.js` - AI provider contract
- `src/ports/auditDb.port.js` - Audit storage contract
- `src/services/sanitizer.service.js` - PII detection and redaction
- `src/services/circuitBreaker.service.js` - Failure tracking and circuit state
- `src/infrastructure/adapters/mockAI.adapter.js` - Mock AI with 2s delay
- `src/infrastructure/adapters/jsonAudit.adapter.js` - JSON file audit storage
- `src/infrastructure/factories/ai.factory.js` - AI adapter resolution
- `src/infrastructure/factories/db.factory.js` - Audit DB adapter resolution
- `src/utils/crypto.util.js` - Encryption for original message storage
- `src/db/audit-log.json` - Audit log storage file

**Dependencies:**
- Express.js (already in project)
- Node.js crypto module (built-in)

**API Surface:**
- New endpoint: `POST /secure-inquiry`
- Success response: `{ answer: string }`
- Circuit breaker response: `{ error: "Service Busy" }` with HTTP 503

**Quality Assurance Workflow:**
- All main functions/components require unit tests (sanitizer, circuit breaker, mockAI, etc.)
- Use `/unit-test-writer` subagent for test creation, specifying function name, file path, and use cases
- Run `/check-unit-tests` skill when updating existing code to verify tests still pass
- Commit stable changes using `/git-commiter` subagent with files and purpose
- Run `/check-stability` skill after each major iteration to verify server functionality
