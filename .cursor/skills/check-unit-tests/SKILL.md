---
name: check-unit-tests
description: Runs unit tests for specified function(s) after code changes, detects failures, and returns feedback with error details, possible solutions, and reasons. Use when an agent or user has changed code and wants to verify unit tests, when given function(s) to test, or after modifications to existing code.
---

# Check Unit Tests

## Mission

Run unit tests after each change on existing code and detect errors. Accept the function(s) to test, run their unit tests, then return feedback about errors and possible solutions and reasons.

## When to Run

- After an agent or user has changed existing code and unit tests should be verified
- When the user or workflow specifies function(s) whose unit tests should run
- When stability or regression of specific behavior needs to be checked

## Instructions

1. **Resolve scope**
   - Accept the function name(s) or module(s) provided (e.g. `sanitize`, `secureInquiry`, or a file path).
   - If none given, infer from context (e.g. recently changed files) or run all tests and say so.

2. **Run unit tests**
   - Use Jest: `npx jest --testPathPattern="<pattern>"` or `npx jest <path-to-test-file>` so only tests for the specified function(s) run. For multiple functions, use a pattern that matches their test files or describe blocks, or run Jest once per function/file.
   - If the project has an npm test script (e.g. `npm test`), use it with the same scope when possible (e.g. `npm test -- --testPathPattern="<pattern>"`).
   - Capture stdout, stderr, and exit code.

3. **Interpret results**
   - **All pass**: Exit code 0, no failing tests. → Report success.
   - **Failures**: Non-zero exit or Jest reports failed tests. → Report errors and feedback.

4. **Return feedback**
   - **Success**: Short message, e.g. "Unit tests passed for [function(s)]."
   - **Failure**:
     - **Error**: Which test(s) failed, assertion message, and expected vs received (from Jest output).
     - **Reason**: Brief explanation of why it failed (e.g. behavior change, wrong assumption, missing mock).
     - **Possible solutions**: One to three concrete fixes (e.g. update implementation to match spec, fix test expectation, add or fix a mock, adjust assertion).

## Feedback template (failure)

Use this structure when tests fail:

```markdown
Unit tests failed for [function(s)].

**Error**
[Test name and describe block]
[Assertion message]
Expected: [expected]
Received: [received]

**Reason**
[One or two sentences explaining why it failed]

**Possible solutions**
1. [Concrete fix]
2. [If needed]
3. [If needed]
```

## Notes

- Run from the project root (where `package.json` is).
- If Jest is not installed, say so and suggest `npm install --save-dev jest` and adding a test script; then re-run after setup.
- Prefer scoping the run to the given function(s) so feedback is focused.
