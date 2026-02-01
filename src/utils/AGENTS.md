# Utils Layer — Guardian Integration Gateway

This layer holds **shared utilities** used across the application. Per the README, crypto lives in `infrastructure/crypto/`; this folder is for general helpers that do not belong to a specific adapter.

---

## Purpose

- Host reusable, low-level utilities
- Keep utilities **pure** where possible (no side effects)
- Avoid duplicating logic across adapters or services

---

## Rules for AI Agents

1. **Single responsibility** — each util does one thing
2. **JSDoc on all exports** — `@param`, `@returns`, `@throws`
3. **No business orchestration** — utils are helpers, not use cases
4. **Prefer readability** — explicit, step-by-step code per AGENTS.md

---

## Relationship to Infrastructure

- **Crypto** → `infrastructure/crypto/crypto.util.js` (encrypt/decrypt for audit)
- **Utils** → General helpers (date formatting, validation helpers, etc.) if needed

If a util is specific to an adapter (e.g., only used by jsonAudit), consider keeping it next to that adapter. This folder is for **cross-cutting** utilities.

---

## File Structure

```
src/utils/
├── (shared helpers as needed)
└── AGENTS.md   # This file
```

---

*Utils support; they do not orchestrate.*
