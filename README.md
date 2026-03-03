# OpenFSM

**Open Source Field Service Management** — a self-hosted platform for independent contractors and small service businesses (1–10 technicians).

OpenFSM implements the full operational loop: **Customer → Job → Estimate → Invoice → Payment → Reporting**, with a mobile-first technician workflow and optional public site and customer portal.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

---

## Features

- **CRM** — Customers, contacts, locations, notes, communication log  
- **Scheduling** — Calendar, technician assignment, status tracking  
- **Jobs** — Work orders, time tracking, photos, signatures, checklists  
- **Estimates & Invoices** — Draft → send → approve/pay with auto-numbering (EST-1001, INV-1001)  
- **Payments** — Manual recording and optional online payment providers  
- **Reporting** — Jobs, revenue, and basic analytics  
- **Public site** — Business landing page, services, contact, online booking  
- **Customer portal** — Self-service: view jobs, estimates, invoices, messages  
- **Field app** — Technician PWA: job list, details, photos, notes, status updates  

---

## Quick start

### Prerequisites

- **Node.js** ≥ 20  
- **pnpm** 9.x (`npm install -g pnpm`)  
- **PostgreSQL** 16 (or use Docker for Postgres only)

### 1. Clone and install

```bash
git clone https://github.com/your-org/openfsm.git
cd openfsm
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL and at least SESSION_SECRET, PORTAL_JWT_SECRET
```

### 3. Database

```bash
pnpm db:migrate
pnpm db:seed   # Optional: sample data (Cool Blasters — jake@coolblasters.com / password123)
```

### 4. Run in development

```bash
pnpm dev
```

| App   | URL                    |
|-------|------------------------|
| Admin (web) | http://localhost:3000 |
| Field (tech) | http://localhost:3001 |
| Site  | http://localhost:3002 |
| Portal | http://localhost:3003 |
| API   | http://localhost:4000 |

**Docker (full stack):** see [Setup tutorial](docs/SETUP_TUTORIAL.md#docker-compose-production-style).

---

## Project structure

Monorepo (pnpm workspaces + Turborepo):

| Path | Description |
|------|-------------|
| `apps/api` | Fastify REST API (port 4000) |
| `apps/web` | Admin/office React UI (port 3000) |
| `apps/field` | Technician mobile PWA (port 3001) |
| `apps/site` | Public business website (port 3002) |
| `apps/portal` | Customer self-service portal (port 3003) |
| `apps/worker` | Background jobs (pg-boss) |
| `packages/core` | Domain services and business logic |
| `packages/db` | Drizzle schema, migrations, seed |
| `packages/ui` | Shared React components |
| `packages/integrations/*` | Calendar, payments, notifications, accounting |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |

Single app: `pnpm --filter @openfsm/api dev`, etc.

---

## Documentation

- **[Setup tutorial](docs/SETUP_TUTORIAL.md)** — Step-by-step local and production setup  
- **[Hosting options](docs/HOSTING.md)** — Self-host, AWS, GCP, DigitalOcean  
- **[OpenFSM_PRD.md](OpenFSM_PRD.md)** — Product requirements and personas  
- **[OpenFSM_Technical_Architecture.md](OpenFSM_Technical_Architecture.md)** — Architecture and APIs  

---

## Tech stack

- **Backend:** Node.js, TypeScript, Fastify, Zod, Drizzle ORM  
- **Frontend:** React 19, React Router, Tailwind, TanStack Query  
- **Database:** PostgreSQL 16  
- **Jobs:** pg-boss (Postgres-backed, no Redis required)  
- **Testing:** Vitest (unit + integration)  

---

## License

AGPL-3.0 — see [LICENSE](LICENSE).
