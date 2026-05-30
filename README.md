# Safe-Phrasing / CyberLab Training Platform

A hands-on cybersecurity training lab modeled after OWASP Juice Shop / DVWA. Students log in and interact with a realistic enterprise-style application containing intentionally vulnerable code patterns for educational analysis and defensive remediation practice.

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 22+, pnpm workspaces |
| **Frontend** | React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui + Wouter |
| **API** | Express 5 (bundled with esbuild) |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Validation** | Zod v4, drizzle-zod |
| **Codegen** | Orval (from OpenAPI spec) |

## Prerequisites

- **Node.js** >= 22
- **pnpm** >= 11 (install with `corepack enable && corepack use pnpm@latest`)
- **Docker** (for running PostgreSQL easily)
- **A terminal with PostgreSQL client** (optional, for verification)

## Quick Start

### 1. Start PostgreSQL

Run the PostgreSQL 16 container:
```bash
docker run -d --name cyberlab-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cyberlab \
  -p 5432:5432 postgres:16
```

To verify it is running:
```bash
docker ps --filter name=cyberlab-pg
```

---

### 2. Environment Setup (Windows Platform Considerations)

If you are running on **Windows**, ensure that your Node.js, pnpm, and Git binaries are visible in your terminal session's `PATH`. The project's root `preinstall` script relies on a POSIX shell (`sh`), which requires Git's shell binaries.

In **PowerShell**, configure your environment variables before proceeding:
```powershell
# Adjust path variables (verify paths match your local installation)
$env:PATH = "C:\Program Files\nodejs;C:\Users\$env:USERNAME\AppData\Roaming\npm;C:\Program Files\Git\usr\bin;" + $env:PATH
```

Additionally, the project has commented out `win32` platform overrides in [pnpm-workspace.yaml](file:///e:/Vuln%20site/pnpm-workspace.yaml) to ensure native Windows dependencies (like `esbuild`, `@tailwindcss/oxide`, etc.) are downloaded correctly.

---

### 3. Install dependencies

Run the following installation command:

**Linux / macOS**:
```bash
pnpm install
```

**Windows (PowerShell)**:
To bypass the Linux-specific shell validation and successfully fetch Windows platform binaries:
```powershell
pnpm install --no-frozen-lockfile --ignore-scripts
```

> **Note:** This project enforces pnpm — if you run `npm install` or `yarn`, the installation will fail.

---

### 4. Push database schema

Apply the Drizzle ORM schema to the Postgres database:

**Linux / macOS**:
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/cyberlab"
pnpm --filter @workspace/db run push
```

**Windows (PowerShell)**:
```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/cyberlab"
pnpm --filter @workspace/db run push
```

You should see: `✔ Changes applied` (14 tables created).

---

### 5. Seed demo data

Populate the database with sample users, products, orders, posts, challenges, and training data:

```bash
# Ensure DATABASE_URL is set in your session
pnpm --filter @workspace/scripts run seed
```

---

### 6. Start the API server (port 8080)

In **Terminal 1**:

**Linux / macOS**:
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/cyberlab"
export PORT=8080
pnpm --filter @workspace/api-server run dev
```

**Windows (PowerShell)**:
```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/cyberlab"
$env:PORT=8080
pnpm --filter @workspace/api-server run dev
```

Verify that the server has started (it will compile with esbuild and then listen):
`[info] Server listening {"port": 8080}`

Verify the API is reachable:
* **Linux / macOS**: `curl http://localhost:8080/api/healthz`
* **Windows (PowerShell)**: `Invoke-RestMethod -Uri http://localhost:8080/api/healthz`

---

### 7. Start the frontend (port 5173)

In **Terminal 2**:

**Linux / macOS**:
```bash
export PORT=5173
export BASE_PATH=/
pnpm --filter @workspace/cyberlab run dev
```

**Windows (PowerShell)**:
```powershell
$env:PORT=5173
$env:BASE_PATH="/"
pnpm --filter @workspace/cyberlab run dev
```

Open `http://localhost:5173` in your browser.

> The Vite dev server proxies `/api/*` requests to the API server (defaults to `http://localhost:8080`, overridable via `API_URL` env var).

## Demo Credentials

| Username | Password | Role |
|---|---|---|
| admin | admin123 | admin |
| test | test123 | user |
| analyst | password123 | analyst |

## Full Script Reference

```bash
# Install all workspace dependencies
pnpm install

# Type-check all packages
pnpm run typecheck

# Type-check + build all packages
pnpm run build

# ---- API server ----
pnpm --filter @workspace/api-server run dev     # Build + start (requires DATABASE_URL + PORT)
pnpm --filter @workspace/api-server run build   # Bundle with esbuild only
pnpm --filter @workspace/api-server run start   # Start built bundle from ./dist/

# ---- Frontend ----
pnpm --filter @workspace/cyberlab run dev       # Vite dev server (requires PORT + BASE_PATH)
pnpm --filter @workspace/cyberlab run build     # Production build to dist/public/
pnpm --filter @workspace/cyberlab run serve     # Preview production build

# ---- Database ----
pnpm --filter @workspace/db exec drizzle-kit push --config ./drizzle.config.ts   # Push schema to DB
pnpm --filter @workspace/db exec drizzle-kit push --force --config ./drizzle.config.ts  # Force push (destructive)

# ---- Seed data ----
pnpm --filter @workspace/scripts run seed       # Seed demo data

# ---- Codegen ----
pnpm --filter @workspace/api-spec run codegen   # Regenerate API hooks from OpenAPI spec
```

## Environment Variables

| Variable | Required | Default | Used By |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | API server, DB scripts |
| `PORT` (API) | Yes | — | API server (e.g. `8080`) |
| `PORT` (Frontend) | Yes | — | Vite dev server (e.g. `5173`) |
| `BASE_PATH` | Yes | — | Frontend (e.g. `/`) |
| `API_URL` | No | `http://localhost:8080` | Frontend proxy target |

## Architecture

```
Safe-Phrasing/
├── artifacts/
│   ├── api-server/              # Express 5 API (port 8080)
│   │   ├── src/
│   │   │   ├── routes/          # Route handlers (16 modules with inline vulnerability notes)
│   │   │   ├── app.ts           # Express app setup (cors, json, pino-logging)
│   │   │   ├── index.ts         # Entry point (reads PORT, starts listening)
│   │   │   └── lib/             # Shared utilities (logger)
│   │   └── build.mjs            # esbuild bundle config
│   └── cyberlab/                # React 19 + Vite frontend (port 5173)
│       └── src/                 # Pages, components, hooks, UI
├── lib/
│   ├── db/                      # Drizzle ORM schema + PostgreSQL client
│   │   └── src/schema/          # 13 table definitions
│   ├── api-zod/                 # Generated Zod schemas shared between API and client
│   ├── api-client-react/        # Generated React Query hooks (Orval / OpenAPI codegen)
│   └── api-spec/                # OpenAPI specification
└── scripts/                     # Utility scripts (seed data, etc.)
    └── src/
        └── seed.ts              # Demo data seeder
```

## API Routes

All routes are mounted under `/api`:

| Route | Description |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/auth/login` | Login |
| ... | Users, Products, Orders, Posts, Comments, Tickets, Uploads, Notifications, Employees, API Keys, Audit Logs, Analytics, Scanner, Challenges |

## Educational Design

This platform **intentionally** includes vulnerable code patterns for training:

| Vulnerability | Pattern |
|---|---|
| Weak password hashing | SHA-256, no salt |
| Predictable auth tokens | Base64-encoded JSON, no signature |
| Mass assignment | Role accepted from registration body |
| No ownership checks | IDOR vulnerabilities on most endpoints |
| Information disclosure | Flag hashes sent to clients |
| No rate limiting | Authentication endpoints are unbounded |

Each vulnerability is documented inline with:
- **CWE classification**
- **Risk explanation**
- **Secure remediation recommendation**

## Troubleshooting

### `pnpm install` fails
Ensure you're running pnpm, not npm/yarn. The project has a preinstall script that rejects non-pnpm package managers.

```bash
corepack enable && corepack use pnpm@latest
pnpm install
```

### `DATABASE_URL` error on push or seed
Make sure PostgreSQL is running and the env var is set:

```bash
# Check Docker
docker ps --filter name=cyberlab-pg

# Verify connection
psql "postgres://postgres:postgres@localhost:5432/cyberlab" -c "SELECT 1"
```

### Port already in use
Change the port:

```bash
export PORT=9090   # API server
export PORT=3000   # Frontend
```

For the frontend, update the proxy target too if the API port changed:
```bash
export API_URL=http://localhost:9090
```

### Type errors or build failures
Run type-check first to locate issues:
```bash
pnpm run typecheck
```

### Drizzle push complains about existing tables
Use the force flag to resolve conflicts:
```bash
pnpm --filter @workspace/db exec drizzle-kit push --force --config ./drizzle.config.ts
```

## License

MIT
