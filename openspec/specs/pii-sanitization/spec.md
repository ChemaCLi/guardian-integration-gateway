## ADDED Requirements

### Requirement: Email addresses are redacted

The sanitizer SHALL detect RFC-style email addresses in the input string and replace each with the literal `<REDACTED: EMAIL>`. Detection MUST use a pattern that matches typical email format (local part @ domain).

#### Scenario: Single email redacted

- **WHEN** input is `"Contact me at john@example.com please"`
- **THEN** output is `"Contact me at <REDACTED: EMAIL> please"`

#### Scenario: Multiple emails redacted

- **WHEN** input contains multiple email addresses
- **THEN** each email is replaced by `<REDACTED: EMAIL>`

#### Scenario: No email leaves text unchanged

- **WHEN** input has no substring matching email format
- **THEN** no `<REDACTED: EMAIL>` appears in output; non-email content is preserved

### Requirement: Credit card numbers are redacted

The sanitizer SHALL detect sequences of 13–19 digits that pass Luhn validation (credit card numbers) and replace each with the literal `<REDACTED: CREDIT_CARD>`. Non-Luhn digit sequences of similar length MUST NOT be redacted as credit cards.

#### Scenario: Valid Luhn sequence redacted

- **WHEN** input contains a valid credit card number (e.g. 4532015112830366)
- **THEN** that sequence is replaced by `<REDACTED: CREDIT_CARD>`

#### Scenario: Invalid Luhn sequence not redacted as credit card

- **WHEN** input contains 16 digits that fail Luhn validation
- **THEN** that sequence is NOT replaced by `<REDACTED: CREDIT_CARD>` (may be left as-is or handled by other rules)

#### Scenario: No credit card leaves text unchanged

- **WHEN** input has no Luhn-valid card number
- **THEN** no `<REDACTED: CREDIT_CARD>` appears in output

### Requirement: SSNs (nine consecutive digits) are redacted

The sanitizer SHALL detect sequences of exactly 9 consecutive digits (Social Security Number pattern) and replace each with the literal `<REDACTED: SSN>`. Shorter or longer digit sequences MUST NOT be replaced by `<REDACTED: SSN>`.

#### Scenario: Nine digits redacted as SSN

- **WHEN** input contains a 9-digit sequence (e.g. 123456789)
- **THEN** that sequence is replaced by `<REDACTED: SSN>`

#### Scenario: Eight or ten digits not redacted as SSN

- **WHEN** input contains only 8 consecutive digits or 10 consecutive digits
- **THEN** that sequence is NOT replaced by `<REDACTED: SSN>`

#### Scenario: No SSN leaves text unchanged

- **WHEN** input has no 9-digit sequence
- **THEN** no `<REDACTED: SSN>` appears in output

### Requirement: Multiple PII types in one message

The sanitizer SHALL apply all redaction rules to the same input. When multiple PII types appear in one message, each MUST be replaced by its corresponding `<REDACTED: TYPE>` placeholder.

#### Scenario: Email and SSN in same message

- **WHEN** input is `"Email user@test.com SSN 123456789"`
- **THEN** output is `"Email <REDACTED: EMAIL> SSN <REDACTED: SSN>"`

#### Scenario: Empty or no PII

- **WHEN** input is empty string or contains no PII
- **THEN** output is the same as input (empty or unchanged content preserved)
