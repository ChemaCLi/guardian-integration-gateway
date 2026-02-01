# Change: secure-inquiry-endpoint

## Overview

Implement a secure endpoint that sanitizes PII from user messages before sending them to AI providers, with audit logging and circuit breaker resilience.

## Quick Links

- **Proposal:** [proposal.md](./proposal.md) - Why this change is needed
- **Workflow:** [WORKFLOW.md](./WORKFLOW.md) - **MANDATORY** quality assurance and development practices
- **Design:** design.md (to be created)
- **Specs:** specs.md (to be created)
- **Tasks:** tasks.md (to be created)

## Status

- [x] Proposal
- [ ] Design
- [ ] Specs
- [ ] Tasks
- [ ] Implementation

## For Agents

**⚠️ IMPORTANT:** Read [WORKFLOW.md](./WORKFLOW.md) before implementing any code.

### Quick Workflow Checklist

Every component must follow this cycle:

1. ✅ Implement the component
2. ✅ Create unit tests with `/unit-test-writer`
3. ✅ Verify tests pass
4. ✅ Commit with `/git-commiter`
5. ✅ Run `/check-stability` after major iterations

### Components Requiring Unit Tests

- `sanitizer.service.js` - PII detection and redaction
- `circuitBreaker.service.js` - Failure tracking
- `mockAI.adapter.js` - Mock AI implementation
- `jsonAudit.adapter.js` - Audit storage
- `crypto.util.js` - Encryption utilities
- `secureInquiry.usecase.js` - Orchestration logic

### Skills Available

- `/check-unit-tests` - Verify existing tests still pass
- `/check-stability` - Verify server starts successfully

### Subagents Available

- `/unit-test-writer` - Create comprehensive unit tests
- `/git-commiter` - Commit changes with conventional messages

---

**Next Step:** Create design.md and specs.md artifacts to define the technical approach and detailed specifications.
