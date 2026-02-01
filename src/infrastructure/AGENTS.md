# Infrastructure Layer — Guardian Integration Gateway

This layer contains **adapters** (concrete implementations of ports), **factories** (that resolve the correct adapter), and **utilities** (e.g., crypto). All external I/O happens here.

---

## Purpose

- Implement ports with real or mock backends (AI, audit DB)
- Centralize configuration via factories
- Provide low-level utilities (encryption) used by adapters

---

## Rules for AI Agents

1. **Each adapter implements exactly one port**
2. **Adapters may use utilities** (e.g., `crypto.util.js`) and config
3. **Factories return the configured adapter** — no adapter imports in use cases
4. **JSDoc on all exports** — document inputs, outputs, side effects

---

## Directory Structure (per README)

```
src/infrastructure/
├── ai/
│   ├── mockAI.adapter.js     # Implements AI port; 2s delay, returns "Generated Answer"
│   └── ai.factory.js         # Returns configured AI adapter
├── db/
│   ├── jsonAudit.adapter.js  # Implements audit port; appends to audit-log.json
│   └── db.factory.js         # Returns configured audit DB adapter
├── crypto/
│   └── crypto.util.js        # encrypt(text), decrypt(cipher)
└── AGENTS.md                 # This file
```

---

## Adapters

### Mock AI Adapter (`ai/mockAI.adapter.js`)

- **Implements:** AI port
- **Behavior:** `setTimeout` 2 seconds, then resolve with `"Generated Answer"`
- **Use case:** Development and testing without a real LLM
- **Error simulation:** Optional — can be extended to reject on demand for circuit breaker testing

### JSON Audit Adapter (`db/jsonAudit.adapter.js`)

- **Implements:** Audit DB port
- **Behavior:** Appends entries to `src/db/audit-log.json`; creates file if missing
- **Entry shape:** `{ userId, originalEncrypted, redactedMessage, timestamp }`
- **Uses:** `crypto.util.js` for encryption (applied by use case before calling adapter, or adapter can encrypt — clarify in use case flow)

---

## Factories

### AI Factory (`ai/ai.factory.js`)

- Returns the AI adapter instance (currently `mockAI`)
- Single point to swap to a real AI provider later

### DB Factory (`db/db.factory.js`)

- Returns the audit DB adapter instance (currently `jsonAudit`)
- Single point to swap to a real database later

---

## Crypto Utility (`crypto/crypto.util.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `encrypt` | `(text: string) => string` | Encrypts plaintext (e.g., AES); key from `config.encryptionKey` |
| `decrypt` | `(cipher: string) => string` | Decrypts to plaintext |

- Use Node built-in `crypto` module
- Key from `config.encryptionKey` (env: `ENCRYPTION_KEY`)
- If no key, consider failing or using a dev default (document behavior)

---

## Dependency Flow

```
Use Case → Port (interface)
              ↑
         Adapter (implements)
              ↑
    Factory (resolves adapter)
              ↑
    Config, crypto.util
```

---

*Infrastructure implements; core orchestrates.*
