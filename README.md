# Guardian Integration Gateway

**Guardian Integration Gateway** is a backend service that acts as a protective layer between users and external AI providers. It receives user messages, detects and redacts sensitive data (emails, credit cards, SSNs) before forwarding them to an LLM, keeps original content secure in the backend, and can inject it back into responses when needed.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Specification](#api-specification)
- [Core Logic Flow](#core-logic-flow)
- [Features](#features)
- [Getting Started](#getting-started)
- [Commands](#commands)
- [Environment Variables](#environment-variables)

---

## Overview

### Problem Statement

When users send messages to AI systems, they may inadvertently include sensitive information such as:
- Email addresses
- Credit card numbers
- Social Security Numbers (SSNs) or similar 9-digit identifiers

Sending this data to external LLM providers poses privacy and compliance risks.

### Solution

Guardian Integration Gateway:

1. **Intercepts** incoming requests containing `userId` and `message`
2. **Sanitizes** the message by replacing sensitive data with placeholders (`<REDACTED: TYPE>`)
3. **Forwards** only the sanitized message to the AI backend
4. **Stores** the original message (encrypted) and redacted version (plaintext) for audit and potential re-injection
5. **Returns** the AI response to the client

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Runtime     | Node.js (≥18) |
| Web server  | Express.js |
| CORS        | `cors` middleware |
| Crypto      | Node built-in `crypto` |
| Config      | `config.js` (env vars) |

No TypeScript; the codebase is plain JavaScript with JSDoc for typing.

---

## Architecture

The project follows **Hexagonal Architecture (Ports & Adapters)** so core business logic stays independent of external systems.

| Layer        | Purpose |
|-------------|---------|
| **Config**  | Loads all settings from environment variables; single source for port, NODE_ENV, encryption key, etc. |
| **Routes**  | Handle HTTP, validate request shape, delegate to use cases. |
| **Use cases** | Orchestrate the flow; depend only on **ports** (interfaces), not adapters. |
| **Ports**   | Abstract contracts (e.g. AI `generateAnswer`, audit `saveAudit`). |
| **Adapters** | Concrete implementations of ports (mock AI, JSON audit DB). |
| **Services** | Pure domain logic (sanitizer, circuit breaker); no I/O to external systems. |

Dependencies flow inward: **Routes → Use cases → Ports ← Adapters**. Use cases and services never import adapters or infrastructure directly.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Config (env vars: port, NODE_ENV, etc.)            │
└─────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────┐
│                         HTTP Request (Express)                        │
└─────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Route Layer                                   │
│                   (secureInquiry.route.js)                            │
└─────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Use Case Layer                                   │
│                   (secureInquiry.usecase.js)                          │
│                                                                       │
│   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │   Sanitizer     │  │ Circuit Breaker  │  │   AI Port        │   │
│   │   Service       │  │   Service       │  │   (interface)    │   │
│   └─────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                         │            │
│   ┌─────────────────┐                                   │            │
│   │   Audit DB Port │                                   │            │
│   │   (interface)   │                                   │            │
│   └─────────────────┘                                   │            │
└─────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  mockAI.adapter  │    │ jsonAudit.adapter│    │  crypto.util     │
│  (AI Adapter)    │    │ (DB Adapter)     │    │  (encryption)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Project Structure

```
├─ index.js                 # Bootstrap: load config, start Express
├─ app.js                   # Express setup, CORS, middleware, mount routes
├─ config.js                # Load env vars (port, NODE_ENV, ENCRYPTION_KEY)
│
├─ src/
│  ├─ routes/               # HTTP handlers (e.g. secureInquiry.route.js)
│  ├─ usecases/             # Orchestration (e.g. secureInquiry.usecase.js)
│  ├─ ports/                # Interfaces (ai.port.js, auditDb.port.js)
│  ├─ services/             # Domain logic (sanitizer, circuitBreaker)
│  ├─ infrastructure/
│  │  └─ adapters/          # Port implementations (mockAI, jsonAudit), factories
│  ├─ db/                   # Audit log storage (audit-log.json)
│  └─ utils/                # Shared utilities (crypto.util.js)
```

---

## API Specification

### Endpoint

| Method | Path           | Description                         |
|--------|----------------|-------------------------------------|
| POST   | `/secure-inquiry` | Submit a message for secure AI processing |

### Request

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "userId": "string",
  "message": "string"
}
```

| Field   | Type   | Required | Description                    |
|---------|--------|----------|--------------------------------|
| userId  | string | Yes      | Identifier of the user         |
| message | string | Yes      | User message (may contain PII) |

### Response (Success)

**200 OK**
```json
{
  "answer": "Generated Answer"
}
```

### Response (Circuit Breaker Open)

**503 Service Unavailable**
```json
{
  "error": "Service Busy"
}
```

---

## Core Logic Flow

### Step 1 — Sanitization

A robust sanitizer strips from `message`:

| Data Type       | Pattern / Rule                         | Replacement            |
|-----------------|----------------------------------------|------------------------|
| Email           | RFC-compliant email pattern            | `<REDACTED: EMAIL>`    |
| Credit Card     | Luhn-valid 13–19 digit cards           | `<REDACTED: CREDIT_CARD>` |
| SSN / 9 digits  | 9 consecutive numeric digits           | `<REDACTED: SSN>`      |

The sanitized message is passed to the AI; the original is stored (encrypted) for audit.

### Step 2 — AI Call

- Uses an **adapter** implementing the AI port.
- Initial implementation: **Mock AI** — `setTimeout` 2 seconds, returns `"Generated Answer"`.
- The **Circuit Breaker** monitors failures. After **3 consecutive failures**, the circuit opens and the API immediately returns `"Service Busy"` without waiting for the timeout.

### Step 3 — Audit Log

- Writes to a mock database (JSON file):
  - `originalMessage`: encrypted
  - `redactedMessage`: plaintext
  - Additional metadata (e.g., userId, timestamp) as needed

---

## Features

| Feature             | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| PII Sanitization    | Redacts emails, credit cards, SSNs before AI processing            |
| Encrypted Storage   | Original messages stored encrypted in the audit log                |
| Circuit Breaker     | Fails fast with "Service Busy" after 3 consecutive AI failures     |
| Ports & Adapters    | Swappable AI and DB implementations without changing core logic    |
| Mock-first          | Uses mock AI and JSON-file DB for development and testing          |

---

## Getting Started

1. Install dependencies: `npm install`
2. Set environment variables as needed (see [Environment Variables](#environment-variables)); defaults work for local development.
3. Run the server: `npm start`
4. Check health: `curl http://localhost:3000/health`
5. When implemented, send a test inquiry:

```bash
curl -X POST http://localhost:3000/secure-inquiry \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "message": "My email is john@example.com and SSN is 123456789"}'
```

---

## Commands

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm install`  | Install dependencies (express, cors) |
| `npm start`    | Start the server (uses `config.port`) |
| `npm run dev`  | Same as start (alias for local dev)   |

---

## Environment Variables

All application settings are loaded via `config.js` from the environment:

| Variable         | Description                    | Default        |
|------------------|--------------------------------|----------------|
| `PORT`           | HTTP server port               | `3000`         |
| `NODE_ENV`       | Environment (e.g. development, production) | `development` |
| `ENCRYPTION_KEY` | Optional key for encrypting original messages in audit log | *(none)* |

Example:

```bash
PORT=4000 NODE_ENV=production npm start
```

---

## License

*(To be defined)*
