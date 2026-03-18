# Druxcar Backend — Development Guidelines

## 1. Infrastructure Prerequisites (One-Time Setup)

These must be in place **before any feature module is built**.

| Concern                   | Tool                                                                                                                                                               | File                                                                                                                    | Status     |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :--------- |
| Security Headers          | `helmet`                                                                                                                                                         | [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)                                                     | ✅ Done    |
| CORS                      | `cors`                                                                                                                                                           | [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)                                                     | ✅ Done    |
| Database Client           | `@prisma/client`                                                                                                                                                 | [src/config/db.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/db.ts)                                           | ✅ Done    |
| Environment Validation    | `zod`                                                                                                                                                            | [src/config/env.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/env.ts)                                         | ✅ Done    |
| Structured Logging        | `pino`                                                                                                                                                           | [src/config/logger.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/logger.ts)                                   | ✅ Done    |
| Request Logging           | `pino-http`                                                                                                                                                      | [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)                                                     | ✅ Done    |
| Rate Limiting             | `express-rate-limit`                                                                                                                                             | [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)                                                     | ✅ Done    |
| Custom Error Class        | [AppError](file:///d:/My%20Coding/backend/druxcars/api/src/lib/AppError.ts#1-12)                                                                                      | [src/lib/AppError.ts](file:///d:/My%20Coding/backend/druxcars/api/src/lib/AppError.ts)                                     | ✅ Done    |
| Standard Response Shape   | [sendSuccess](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#3-10) / [sendError](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#14-21) | [src/lib/response.ts](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts)                                     | ✅ Done    |
| Centralized Error Handler | Express error middleware                                                                                                                                           | [src/middleware/error.middleware.ts](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/error.middleware.ts)       | ✅ Done    |
| Request Validation        | `zod` + middleware                                                                                                                                               | [src/middleware/validate.middleware.ts](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/validate.middleware.ts) | ✅ Done    |
| Auth Middleware           | JWT verify                                                                                                                                                         | `src/middleware/auth.middleware.ts`                                                                                   | ⬜ Pending |

---

## 2. Folder Convention Per Module

Each feature module lives in `src/modules/<domain>/` and must follow this structure:

```
src/modules/<domain>/
├── <domain>.routes.ts      # Route definitions, applies validation middleware
├── <domain>.controller.ts  # Thin HTTP layer — calls service, returns response
├── <domain>.service.ts     # Business logic — calls Prisma, throws AppError
└── <domain>.schema.ts      # Zod schemas for request validation
```

---

## 3. Per-Module Development Checklist

Before starting any new module, go through this checklist **in order**:

### Step 1 — Schema

- [ ] Define or update Prisma model(s) in [prisma/schema.prisma](file:///d:/My%20Coding/backend/druxcars/api/prisma/schema.prisma)
- [ ] Run `npm run prisma:push` (dev) or `npx prisma migrate dev --name <description>` (staging/prod)
- [ ] Run `npm run prisma:generate` to regenerate the Prisma Client types

### Step 2 — Validation Schemas

- [ ] Define all request body / query / param shapes as **Zod schemas** in `<domain>.schema.ts`
- [ ] Export inferred TypeScript types from the schemas (e.g. `export type LoginInput = z.infer<typeof loginSchema>`)

### Step 3 — Service Layer

- [ ] Write business logic in `<domain>.service.ts`
- [ ] Use the shared [prisma](file:///d:/My%20Coding/backend/druxcars/api/prisma/schema.prisma) client from [src/config/db.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/db.ts)
- [ ] Throw [AppError](file:///d:/My%20Coding/backend/druxcars/api/src/lib/AppError.ts#1-12) (with HTTP status code) on known failures
- [ ] Add structured log calls at key decision points (`logger.info`, `logger.warn`, `logger.error`)

### Step 4 — Controller

- [ ] Keep controllers **thin** — parse validated input, call service, return [sendSuccess](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#3-10) / [sendError](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#14-21)
- [ ] Do **not** put business logic in controllers

### Step 5 — Routes

- [ ] Register routes in `<domain>.routes.ts`
- [ ] Apply [validate(schema)](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/validate.middleware.ts#8-21) middleware before the controller
- [ ] Apply `authenticate` middleware on protected routes
- [ ] Mount the router in [src/server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts) under `/api/v1/<domain>`

### Step 6 — Testing (minimum bar)

- [ ] Manually test all new endpoints via Prisma Studio or an HTTP client (e.g. Bruno, Postman)
- [ ] Confirm structured logs appear correctly for success and error paths

---

## 4. Coding Standards

### Error Handling

- All errors are thrown as [AppError(message, httpStatusCode)](file:///d:/My%20Coding/backend/druxcars/api/src/lib/AppError.ts#1-12) from services
- The global error middleware in [src/middleware/error.middleware.ts](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/error.middleware.ts) catches everything and formats the response

### API Response Shape

Every response uses a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "MESSAGE", "code": 400 }
```

### Logging

- Use `pino` for structured JSON logs
- Log every **incoming request** via `pino-http` middleware
- Log at service level for: successful DB writes, auth events, and errors

### Environment Variables

- **Never** access `process.env` directly in modules — import from [src/config/env.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/env.ts)
- [env.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/env.ts) validates all vars on startup with Zod and throws if any are missing

---

## 5. Infrastructure Build Order

**Before writing any feature:**

1. Install infra packages (`pino`, `zod`, `express-rate-limit`)
2. Create [src/config/env.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/env.ts) — validated env schema
3. Create [src/config/logger.ts](file:///d:/My%20Coding/backend/druxcars/api/src/config/logger.ts) — pino logger instance
4. Add `pino-http` request logger to [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)
5. Create [src/lib/AppError.ts](file:///d:/My%20Coding/backend/druxcars/api/src/lib/AppError.ts) — custom error class
6. Create [src/lib/response.ts](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts) — [sendSuccess](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#3-10) / [sendError](file:///d:/My%20Coding/backend/druxcars/api/src/lib/response.ts#14-21) helpers
7. Create [src/middleware/error.middleware.ts](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/error.middleware.ts) — global error handler
8. Create [src/middleware/validate.middleware.ts](file:///d:/My%20Coding/backend/druxcars/api/src/middleware/validate.middleware.ts) — Zod request validation middleware
9. Add rate limiting to [server.ts](file:///d:/My%20Coding/backend/druxcars/api/src/server.ts)

Only once all 9 steps above are green, begin Feature Module implementation.
