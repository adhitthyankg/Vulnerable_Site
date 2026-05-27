# CyberLab Training Platform

A hands-on cybersecurity training lab modeled after OWASP Juice Shop / DVWA. Students log in and interact with a realistic enterprise-style application containing intentionally vulnerable code patterns for educational analysis and defensive remediation practice.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/cyberlab run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Demo Training Credentials

| Username | Password | Role |
|---|---|---|
| admin | admin123 | admin |
| test | test123 | user |
| analyst | password123 | analyst |

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — Drizzle table definitions (users, products, orders, posts, comments, tickets, uploads, notifications, employees, apiKeys, auditLogs)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/cyberlab/src/` — React frontend
- `artifacts/cyberlab/src/pages/` — All application pages

## Architecture decisions

- Auth uses base64-encoded JSON "tokens" (intentionally weak — educational).  Real apps use signed JWTs.
- Passwords hashed with unsalted SHA-256 (intentionally insecure for training). Real apps use bcrypt/argon2.
- Role accepted from registration body (mass assignment vulnerability, intentional). Real apps derive role server-side only.
- No ownership checks on most endpoints — IDOR vulnerabilities are intentional training scenarios.
- Inline educational comments throughout route handlers explain each vulnerability, its CWE classification, and the secure remediation.

## Product

- Login/Register with demo training accounts
- Admin dashboard with analytics, vulnerability stats charts, and activity feeds
- Full CRUD: Users, Products, Orders, Blog Posts, Comments, Tickets, Uploads, Notifications, Employees, API Keys
- Audit log viewer showing IP addresses and user actions
- API documentation page
- Each vulnerable pattern includes inline `// EDUCATIONAL NOTE:` comments with CWE reference, risk explanation, and secure coding recommendation

## User preferences

_Populate as needed._

## Gotchas

- After adding new DB schema files, always run `pnpm run typecheck:libs` to rebuild declarations before the API server will see them.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before using new hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
