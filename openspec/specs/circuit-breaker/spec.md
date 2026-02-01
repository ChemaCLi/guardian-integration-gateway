## ADDED Requirements

### Requirement: Circuit starts closed

The circuit breaker SHALL start in the closed state. When closed, the use case MUST call the AI adapter for each valid request (subject to other flow rules).

#### Scenario: First request proceeds to AI

- **WHEN** no failures have been recorded and client sends valid request
- **THEN** isOpen() returns false and the AI adapter is invoked

### Requirement: Consecutive failures open the circuit after three

The circuit breaker SHALL count consecutive AI call failures. After exactly three consecutive failures, the circuit MUST transition to open. While open, isOpen() SHALL return true.

#### Scenario: One or two failures keep circuit closed

- **WHEN** recordFailure() has been called once or twice and no success in between
- **THEN** isOpen() returns false

#### Scenario: Third consecutive failure opens circuit

- **WHEN** recordFailure() is called a third time consecutively (no recordSuccess() in between)
- **THEN** isOpen() returns true

#### Scenario: Open circuit causes immediate Service Busy response

- **WHEN** circuit is open and client sends valid request
- **THEN** API returns HTTP 503 with body `{ "error": "Service Busy" }` without invoking the AI adapter

### Requirement: Success resets failure count

When the AI call succeeds, the use case SHALL call recordSuccess(). The circuit breaker MUST reset the consecutive failure count to zero when recordSuccess() is called. After a reset, the circuit SHALL be closed (isOpen() returns false) until three consecutive failures occur again.

#### Scenario: Success after one failure resets count

- **WHEN** recordFailure() was called once, then recordSuccess() is called
- **THEN** next recordFailure() is counted as first of a new sequence (not second)

#### Scenario: Success after two failures resets count

- **WHEN** recordFailure() was called twice, then recordSuccess() is called
- **THEN** isOpen() returns false and two more consecutive failures are required to open the circuit

### Requirement: No half-open or auto-recovery in v1

The circuit SHALL have only two states: closed and open. There SHALL be no half-open state or automatic time-based recovery in this version. The circuit remains open until recordSuccess() is called (which implies an AI call was made; for v1, opening may persist until process restart unless the use case explicitly calls recordSuccess() after a successful call—see design).

#### Scenario: Circuit stays open until success

- **WHEN** circuit has been opened by three consecutive failures
- **THEN** it remains open (isOpen() true) until recordSuccess() is called after a successful AI call
