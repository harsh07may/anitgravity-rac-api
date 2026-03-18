# Druxcar API — Development Rules

## Stack
- **Runtime**: Node.js with TypeScript (`tsx watch` for dev, `tsc` for build)
- **Framework**: Express.js v5
- **ORM**: Prisma v7 (MySQL)
- **Validation**: Zod v4
- **Logging**: pino (structured JSON in prod, pino-pretty in dev)

## Folder Convention
Each feature module lives in `src/modules/<domain>/` with this exact structure:
```
src/modules/<domain>/
├── <domain>.routes.ts      # Route definitions + validation middleware
├── <domain>.controller.ts  # Thin HTTP layer — calls service, returns response
├── <domain>.service.ts     # All business logic — calls Prisma, throws AppError
└── <domain>.schema.ts      # Zod schemas + inferred TS types
```

## Coding Rules

### Imports
- Always use `.js` extension on relative imports (ESM requirement)
- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled)
- Never access `process.env` directly — always import from `src/config/env.ts`

### Error Handling
- Services **must** throw `AppError` (from `src/lib/AppError.ts`) for known failures
- Use the factory helpers: `NotFound()`, `Unauthorized()`, `Forbidden()`, `BadRequest()`, `Conflict()`
- Never put try/catch in controllers — let errors bubble to the global error middleware
- The global handler (`src/middleware/error.middleware.ts`) is the single source of truth for error responses

### Responses
- All responses use `sendSuccess`, `sendCreated`, or `sendError` from `src/lib/response.ts`
- **Never** call `res.json()` or `res.send()` directly in a controller
- Success envelope: `{ "success": true, "data": { ... } }`
- Error envelope: `{ "success": false, "error": "MESSAGE", "code": 400 }`

### Validation
- Every route that accepts input **must** use `validate(schema)` middleware before the controller
- Zod schemas live in `<domain>.schema.ts` and export both the schema and the inferred type

### Logging
- Use the shared `logger` from `src/config/logger.ts`
- Log in services at: auth events, successful DB writes, and errors
- Never use `console.log` — use `logger.info`, `logger.warn`, `logger.error`

## Per-Module Checklist
Before implementing a new module, verify in this order:

1. [ ] Prisma schema updated → `npm run prisma:push` → `npm run prisma:generate`
2. [ ] Zod schemas defined in `<domain>.schema.ts`
3. [ ] Service written with proper `AppError` throws and `logger` calls
4. [ ] Controller is thin — parse validated input, call service, return helper
5. [ ] Routes file applies `validate()` and `authenticate` (if protected)
6. [ ] Router mounted in `server.ts` under `/api/v1/<domain>`
7. [ ] TypeScript compiles clean: `npx tsc --noEmit`
