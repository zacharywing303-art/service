# OpenFSM Setup Tutorial

This tutorial walks you through setting up OpenFSM for **local development** and **production-style deployment** (Docker Compose). For cloud hosting (AWS, GCP, DigitalOcean), see [HOSTING.md](HOSTING.md).

---

## Part 1: Local development setup

### 1.1 Prerequisites

Install the following:

| Requirement | Version | Notes |
|-------------|---------|--------|
| **Node.js** | ≥ 20 | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| **pnpm** | 9.x | `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| **PostgreSQL** | 16 | Local install or Docker (see below) |
| **Git** | — | To clone the repo |

### 1.2 Clone the repository

```bash
git clone https://github.com/your-org/openfsm.git
cd openfsm
```

### 1.3 Install dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces (apps and packages) in the monorepo.

### 1.4 PostgreSQL for development

**Option A — Local PostgreSQL**

1. Install PostgreSQL 16 and create a database:

   ```bash
   createdb openfsm
   ```

2. Or with Docker (Postgres only):

   ```bash
   docker run -d --name openfsm-postgres \
     -e POSTGRES_USER=openfsm \
     -e POSTGRES_PASSWORD=openfsm \
     -e POSTGRES_DB=openfsm \
     -p 5432:5432 \
     postgres:16-alpine
   ```

**Option B — Use the dev Compose stack (Postgres only)**

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts only Postgres on port 5432 with the same credentials as above.

### 1.5 Environment configuration

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set at least:

   - **DATABASE_URL** — e.g. `postgresql://openfsm:openfsm@localhost:5432/openfsm`
   - **SESSION_SECRET** — Random string (e.g. 32+ chars). Generate with: `openssl rand -hex 32`
   - **PORTAL_JWT_SECRET** — Another random string for portal magic-link JWTs

   Leave other values as-is for local dev, or set SMTP, storage, and Google Calendar if you need them.

### 1.6 Database migrations and seed

Run migrations:

```bash
pnpm db:migrate
```

Optional — seed with sample data (Cool Blasters HVAC company):

```bash
pnpm db:seed
```

**Seed login:** `jake@coolblasters.com` / `password123`

### 1.7 Start the development servers

```bash
pnpm dev
```

This starts (via Turborepo):

- **API** — http://localhost:4000  
- **Web (admin)** — http://localhost:3000  
- **Field** — http://localhost:3001  
- **Site** — http://localhost:3002  
- **Portal** — http://localhost:3003  

If you seeded the database, log in at http://localhost:3000 with the seed credentials.

### 1.8 Run a single app

Use filters to run only what you need:

```bash
pnpm --filter @openfsm/api dev
pnpm --filter @openfsm/web dev
pnpm --filter @openfsm/field dev
# etc.
```

The API must be running for the frontend apps to work (they call `/api`).

### 1.9 Running tests

- **Test database:** Use the test Compose file so tests don’t touch your dev DB:

  ```bash
  docker compose -f docker-compose.test.yml up -d
  ```

  This starts Postgres on **port 5433** with database `openfsm_test`.

- **Run all tests:**

  ```bash
  pnpm test
  ```

- **Run tests for one package:**

  ```bash
  pnpm --filter @openfsm/core test
  pnpm --filter @openfsm/api test
  ```

---

## Part 2: Docker Compose (production-style)

For a single-server deployment that mirrors production (all services in containers), use the main Compose file.

### 2.1 Prerequisites

- **Docker** and **Docker Compose v2** (`docker compose` in CLI)

### 2.2 Build and run

From the project root:

```bash
docker compose up -d --build
```

This builds and starts:

- **postgres** — PostgreSQL 16  
- **api** — API server (port 4000)  
- **worker** — Background job processor  
- **web** — Admin UI (port 3000)  
- **site** — Public site (port 3002)  
- **portal** — Customer portal (port 3003)  

**Note:** The Field app is not included in the default Compose stack; it’s typically used as a PWA from the same host as the admin or site. You can add it by defining a `field` service if needed.

### 2.3 First run: migrations and seed

The API container does not run migrations automatically. From your **host** (with the repo and `pnpm` installed), point `DATABASE_URL` at the Compose Postgres and run migrations once:

```bash
# Ensure Postgres is up
docker compose up -d postgres

# Set DATABASE_URL to the Compose Postgres (exposed on localhost:5432)
export DATABASE_URL=postgresql://openfsm:openfsm@localhost:5432/openfsm
pnpm db:migrate
pnpm db:seed   # optional
```

Then start the rest of the stack:

```bash
docker compose up -d
```

### 2.4 URLs (no reverse proxy)

With default mapping:

| Service | URL |
|---------|-----|
| Admin (web) | http://localhost:3000 |
| Site | http://localhost:3002 |
| Portal | http://localhost:3003 |
| API | http://localhost:4000 |

Frontend containers proxy `/api` to the API service internally.

### 2.5 Self-host installer (optional)

For a server with a real domain and TLS, you can use the provided installer and Caddy:

1. Copy the repo to the server and go to the project root.
2. Run:

   ```bash
   ./deploy/self-host/install.sh
   ```

3. When prompted, enter your domain (e.g. `yourcompany.com`). The script:
   - Generates `SESSION_SECRET`, `PORTAL_JWT_SECRET`, and `POSTGRES_PASSWORD`
   - Writes a `.env` for Docker Compose
   - Starts the stack with `docker compose up -d`

4. Configure your DNS so your domain (and optionally `admin.`, `portal.`) point to the server.
5. Use the Caddyfile in `deploy/self-host/caddy/` with Caddy so that:
   - `admin.<domain>` → web + `/api` → api  
   - `portal.<domain>` → portal + `/api` → api  
   - `<domain>` (root) → site + `/api` → api  

Then enable HTTPS (Caddy will obtain certificates automatically if the domain resolves to this host).

---

## Part 3: Environment reference

| Variable | Description | Example |
|----------|-------------|---------|
| **DATABASE_URL** | PostgreSQL connection string | `postgresql://user:pass@host:5432/openfsm` |
| **API_PORT** | API server port | `4000` |
| **API_HOST** | Bind address | `0.0.0.0` |
| **SESSION_SECRET** | Secret for session cookies | 32+ random chars |
| **PORTAL_JWT_SECRET** | Secret for portal JWTs | 32+ random chars |
| **CORS_ORIGIN** | Allowed origins (comma-separated) | `http://localhost:3000,http://localhost:3001,...` |
| **WEB_URL** | Admin app URL | `http://localhost:3000` |
| **FIELD_URL** | Field app URL | `http://localhost:3001` |
| **SITE_URL** | Public site URL | `http://localhost:3002` |
| **PORTAL_URL** | Portal URL | `http://localhost:3003` |
| **SMTP_*** | SMTP for email | Optional |
| **STORAGE_PROVIDER** | `local` or S3-compatible | `local` |
| **STORAGE_LOCAL_PATH** | Path for local uploads | `./uploads` or `/app/uploads` |
| **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** / **GOOGLE_REDIRECT_URI** | Google Calendar OAuth | Optional |

---

## Troubleshooting

### "Cannot connect to database"

- Ensure Postgres is running and reachable at the host/port in `DATABASE_URL`.
- For Docker dev: `docker compose -f docker-compose.dev.yml up -d`.
- For tests: use `docker-compose.test.yml` and ensure the test runner uses port 5433 and `openfsm_test`.

### "Session secret must be set"

- Set `SESSION_SECRET` and `PORTAL_JWT_SECRET` in `.env` to long random strings.

### Port already in use

- Change ports in `.env` (e.g. `API_PORT`) or in each app’s dev script (e.g. `vite --port 3004`).
- For Docker, change the host port in `docker-compose.yml` (e.g. `"3004:80"`).

### Migrations fail or schema is out of date

- Regenerate migrations: `pnpm db:generate`
- Then run: `pnpm db:migrate`

### Frontend shows network errors to /api

- Ensure the API is running and `CORS_ORIGIN` includes the frontend origin (e.g. `http://localhost:3000`).
- In Docker, frontends proxy `/api` to the `api` service; ensure the `api` service is healthy.

---

## Next steps

- Configure [SMTP and notifications](https://github.com/your-org/openfsm/blob/main/OpenFSM_PRD.md) for emails.
- Set up [Google Calendar](https://github.com/your-org/openfsm/blob/main/OpenFSM_Technical_Architecture.md) OAuth for scheduling.
- Deploy to a cloud provider: [HOSTING.md](HOSTING.md).
