# Implementation Workflow for secure-inquiry-endpoint

This document defines the quality assurance and development workflow that all agents must follow when implementing this change.

---

## 1. Unit Testing Requirements

### 1.1 Components Requiring Unit Tests

Every main function or component must have comprehensive unit tests. For this change, the following require tests:

| Component | File Path | Function(s) to Test |
|-----------|-----------|---------------------|
| Sanitizer | `src/services/sanitizer.service.js` | `sanitize()` |
| Circuit Breaker | `src/services/circuitBreaker.service.js` | `isOpen()`, `recordFailure()`, `recordSuccess()` |
| Mock AI Adapter | `src/infrastructure/adapters/mockAI.adapter.js` | `generateAnswer()` |
| JSON Audit Adapter | `src/infrastructure/adapters/jsonAudit.adapter.js` | `saveAudit()` |
| Crypto Utility | `src/utils/crypto.util.js` | `encrypt()`, `decrypt()` |
| Secure Inquiry Use Case | `src/usecases/secureInquiry.usecase.js` | Main orchestration flow |

### 1.2 Creating Unit Tests

**Use the `/unit-test-writer` subagent** for all test creation.

**Required parameters:**
- Function name (e.g., `sanitize`)
- File path (e.g., `src/services/sanitizer.service.js`)
- Use cases the function should cover

**Example invocation:**
```
Task(
  subagent_type="unit-test-writer",
  description="Write sanitizer unit tests",
  prompt="Create unit tests for the sanitize function in src/services/sanitizer.service.js.

Use cases to cover:
1. Should redact email addresses and replace with <REDACTED: EMAIL>
2. Should redact valid credit card numbers (Luhn check) and replace with <REDACTED: CREDIT_CARD>
3. Should redact SSNs (9 consecutive digits) and replace with <REDACTED: SSN>
4. Should handle multiple PII types in one message
5. Should return unchanged text when no PII is present
6. Should handle empty strings
7. Should preserve non-PII content exactly"
)
```

---

## 2. Verification When Updating Existing Code

When modifying any existing code that has unit tests:

### Step 1: Run Existing Tests
Use the `/check-unit-tests` skill to verify tests still pass:
- Specify the function name(s) or test file pattern
- The skill will run Jest with the appropriate scope
- Review the output for failures

### Step 2: Update Tests if Needed
If tests fail due to intentional behavior changes:
- Use `/unit-test-writer` subagent to update the tests
- Provide the new use cases or behavior expectations
- Re-run `/check-unit-tests` to verify

### Step 3: Never Skip This
**Rule:** Do NOT update existing tested code without running `/check-unit-tests` first.

---

## 3. Committing Changes

### 3.1 When to Commit

Commit after creating a **stable, working change**:
- A complete component with its unit tests passing
- A logical unit of work (e.g., "Add sanitizer service with PII detection")
- After fixing bugs or updating code with passing tests

### 3.2 Using the git-commiter Subagent

**Use the `/git-commiter` subagent** for all commits.

**Required parameters:**
- Files to commit (specific paths)
- Purpose of the changes (clear description)

**Example invocation:**
```
Task(
  subagent_type="git-commiter",
  description="Commit sanitizer implementation",
  prompt="Commit the following files:
- src/services/sanitizer.service.js
- src/services/__tests__/sanitizer.service.test.js

Purpose: Add PII sanitization service that detects and redacts emails, credit cards, and SSNs from user messages. Includes comprehensive unit tests covering all detection patterns and edge cases."
)
```

### 3.3 Commit Granularity

Prefer smaller, focused commits:
- ✅ "Add sanitizer service with unit tests"
- ✅ "Add circuit breaker service with failure tracking"
- ✅ "Add mock AI adapter with 2s delay"
- ❌ "Add all services and adapters" (too broad)

---

## 4. Stability Verification

### 4.1 When to Run

Use the `/check-stability` skill after each **major iteration**:
- After implementing a complete layer (e.g., all services)
- After integrating multiple components (e.g., route + use case + services)
- Before moving to the next major phase
- After fixing critical bugs

### 4.2 What It Does

The skill:
1. Runs `npm run dev`
2. Waits for startup (5-10 seconds)
3. Checks for errors or successful server start
4. Reports success or provides error analysis with fix suggestions

### 4.3 Response to Failures

If `/check-stability` fails:
1. **Stop** implementing new features
2. **Fix** the reported error immediately
3. **Re-run** `/check-stability` to verify the fix
4. **Commit** the fix once stable
5. **Then** continue with new work

**Rule:** Never proceed with new implementation if the server is broken.

---

## 5. Implementation Sequence

Follow this order to ensure quality at each step:

### Phase 1: Core Services
1. Implement `sanitizer.service.js`
2. Create unit tests with `/unit-test-writer`
3. Verify tests pass
4. Commit with `/git-commiter`
5. Implement `circuitBreaker.service.js`
6. Create unit tests with `/unit-test-writer`
7. Verify tests pass
8. Commit with `/git-commiter`
9. Run `/check-stability`

### Phase 2: Infrastructure
1. Implement `crypto.util.js`
2. Create unit tests with `/unit-test-writer`
3. Verify tests pass
4. Commit with `/git-commiter`
5. Implement `mockAI.adapter.js` with `ai.port.js`
6. Create unit tests with `/unit-test-writer`
7. Verify tests pass
8. Commit with `/git-commiter`
9. Implement `jsonAudit.adapter.js` with `auditDb.port.js`
10. Create unit tests with `/unit-test-writer`
11. Verify tests pass
12. Commit with `/git-commiter`
13. Implement factories (`ai.factory.js`, `db.factory.js`)
14. Run `/check-stability`

### Phase 3: Use Case & Route
1. Implement `secureInquiry.usecase.js`
2. Create unit tests with `/unit-test-writer`
3. Verify tests pass
4. Commit with `/git-commiter`
5. Implement `secureInquiry.route.js`
6. Mount route in `app.js`
7. Run `/check-stability`
8. Test endpoint manually or with integration tests
9. Commit with `/git-commiter`

---

## 6. Quality Gates

Before considering this change complete:

- [ ] All main functions have unit tests
- [ ] All unit tests pass (`npm test`)
- [ ] Server starts successfully (`/check-stability`)
- [ ] All changes are committed with clear messages
- [ ] Endpoint responds correctly to valid requests
- [ ] Circuit breaker behavior verified (manual or integration test)
- [ ] PII sanitization verified with test cases
- [ ] Audit log contains encrypted and sanitized messages

---

## 7. Agent Instructions Summary

**For any agent working on this change:**

1. **Before writing code:** Check if the component needs unit tests (see section 1.1)
2. **After writing code:** Use `/unit-test-writer` to create tests
3. **Before modifying existing code:** Run `/check-unit-tests`
4. **After stable changes:** Use `/git-commiter` to commit
5. **After major iterations:** Run `/check-stability`
6. **If stability fails:** Stop and fix before continuing

**Never skip these steps.** They ensure code quality, prevent regressions, and maintain a clean git history.

---

*This workflow is mandatory for all agents implementing the secure-inquiry-endpoint change.*
