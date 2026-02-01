# Routes Layer — Guardian Integration Gateway

This layer handles **HTTP requests and responses**. Routes validate input, call use cases, and format HTTP status codes and body.

---

## Purpose

- Parse and validate request body (`userId`, `message`)
- Delegate to use case; no business logic in routes
- Map use case results to HTTP responses (200, 503, 400, 500)

---

## Rules for AI Agents

1. **Thin layer** — validate, delegate, respond; no orchestration
2. **Validate request shape** — ensure `userId` and `message` are present and are strings
3. **Handle use case output** — map `circuitOpen` to 503, success to 200
4. **Use meaningful status codes** — 400 for bad request, 500 for unexpected errors, 503 for circuit breaker

---

## Endpoint: POST /secure-inquiry

| Aspect | Specification |
|--------|---------------|
| Path | `/secure-inquiry` |
| Method | POST |
| Content-Type | `application/json` |
| Body | `{ userId: string, message: string }` |

### Request Validation

- `userId` and `message` must be present
- Both must be non-empty strings (or define rules for empty message)
- Return **400 Bad Request** with clear error message if invalid

### Response Mapping

| Use Case Result | HTTP Status | Body |
|-----------------|-------------|------|
| Success | 200 OK | `{ "answer": "..." }` |
| Circuit breaker open | 503 Service Unavailable | `{ "error": "Service Busy" }` |
| Invalid request | 400 Bad Request | `{ "error": "..." }` |
| AI or audit failure | 500 Internal Server Error | `{ "error": "..." }` (or generic message) |

---

## File Structure

```
src/routes/
├── secureInquiry.route.js   # POST /secure-inquiry handler
└── AGENTS.md                # This file
```

---

## Route Responsibilities

1. **Parse body** — `req.body.userId`, `req.body.message`
2. **Validate** — Check presence and types; return 400 if invalid
3. **Call use case** — `await executeSecureInquiry({ userId, message })`
4. **Map result** — If `circuitOpen`, send 503 with `{ error: "Service Busy" }`; else send 200 with `{ answer }`
5. **Catch errors** — Return 500 with generic error (avoid leaking internals)

---

## JSDoc Example

```javascript
/**
 * Registers the secure-inquiry route on the Express app.
 *
 * @param {import('express').Express} app - Express application instance
 * @param {Object} deps - Dependencies (use case, etc.)
 */
function registerSecureInquiryRoute(app, deps) {
  app.post('/secure-inquiry', async (req, res) => {
    // validate, delegate, respond
  });
}
```

---

*Routes handle HTTP; use cases handle logic.*
