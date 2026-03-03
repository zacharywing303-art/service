# OpenFSM Hosting Options

This guide summarizes ways to run OpenFSM in production and points to the configs in this repo. Choose based on cost, control, and operational preference.

---

## Overview

| Option | Best for | Complexity | Approx. cost (small) | Data location |
|--------|-----------|------------|----------------------|---------------|
| **Self-host (VPS + Docker)** | Full control, single server | Medium | $5–20/mo | Your server |
| **DigitalOcean App Platform** | Easiest managed deploy | Low | ~$25–50/mo | DO region |
| **AWS (ECS + RDS)** | AWS ecosystem, compliance | High | ~$50–100/mo | Your region |
| **GCP (Cloud Run + Cloud SQL)** | Scale-to-zero, serverless | Medium–High | ~$30–80/mo | Your region |

---

## 1. Self-hosted (VPS + Docker Compose)

Run OpenFSM on a single VPS (DigitalOcean Droplet, Linode, Vultr, Hetzner, etc.) with Docker and a reverse proxy. You manage the server and backups.

### Requirements

- **VPS:** 2 GB RAM minimum, 1 vCPU; 4 GB RAM recommended for production.
- **Docker** and **Docker Compose v2**.
- **Domain** pointing to the server (for TLS and CORS).

### Steps

1. **Provision a VPS** (Ubuntu 22.04 LTS is a good default).
2. **Install Docker:**  
   [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) and [Docker Compose v2](https://docs.docker.com/compose/install/).
3. **Clone the repo** on the server and `cd` into the project root.
4. **Run the installer:**

   ```bash
   chmod +x deploy/self-host/install.sh
   ./deploy/self-host/install.sh
   ```

   When prompted, enter your domain (e.g. `yourcompany.com`). The script generates secrets and writes `.env` for Compose.

5. **Start the stack:**

   ```bash
   docker compose up -d --build
   ```

6. **Run migrations** (from host, with repo and pnpm, or from a one-off container that has access to the DB):

   ```bash
   export DATABASE_URL=postgresql://openfsm:YOUR_POSTGRES_PASSWORD@localhost:5432/openfsm
   pnpm db:migrate
   pnpm db:seed   # optional
   ```

   Use the `POSTGRES_PASSWORD` from the generated `.env`.

7. **Reverse proxy and TLS:**  
   Use the provided Caddyfile as a reference:

   - `deploy/self-host/caddy/Caddyfile` — subdomains: `admin.<domain>`, `portal.<domain>`, and main `<domain>` for the site; `/api` proxied to the API container.

   Install Caddy, copy/adapt the Caddyfile, and reload. Caddy will obtain Let’s Encrypt certificates if the domain resolves to this host.

8. **Backups:**  
   Back up the `postgres_data` volume and any uploads volume (or S3 bucket if you switch to S3). Example:

   ```bash
   docker compose exec postgres pg_dump -U openfsm openfsm > backup_$(date +%Y%m%d).sql
   ```

### Pros and cons

- **Pros:** Full control, no vendor lock-in, predictable cost, data on your server.
- **Cons:** You handle OS updates, backups, and monitoring.

---

## 2. DigitalOcean App Platform

Managed app hosting with built-in Postgres. Good fit if you want minimal DevOps.

### What’s in the repo

- **`deploy/digitalocean/app-spec.yml`** — App Platform spec: one PG 16 database and services for `api`, `web`, and `worker`. You’d add `site` and `portal` services similarly.

### Steps (high level)

1. **Build and push images** to DigitalOcean Container Registry (DOCR), or connect the repo and let DO build from Dockerfiles.
2. **Create an App** from the spec (or via UI):
   - Add a **database** (PostgreSQL 16, e.g. `db-s-1vcpu-1gb`).
   - Add **services** for api, web, site, portal, worker using the images and env from the spec.
3. **Set env vars:**  
   `DATABASE_URL` is typically injected from the managed DB. Set `SESSION_SECRET`, `PORTAL_JWT_SECRET`, `CORS_ORIGIN`, and app URLs via the dashboard or spec.
4. **Routes:**  
   Map paths (e.g. `/api`) to the api service; assign custom domains to web, site, portal.
5. **Run migrations** once (e.g. run the db migrate script as a job or from your laptop against the DB connection string DO provides).

### Pricing (indicative)

- Managed Postgres: ~\$15/mo and up.
- App services: from ~\$5/mo per small container.
- Total often **~\$25–50/mo** for a small deployment.

### Pros and cons

- **Pros:** Managed DB and runtimes, simple deploys, integrated TLS and scaling.
- **Cons:** Less control than self-host; cost grows with more services.

---

## 3. AWS (ECS + RDS)

For teams already on AWS or needing AWS compliance and services.

### What’s in the repo

- **`deploy/aws/cloudformation.yml`** — Defines a VPC, RDS PostgreSQL 16 instance, and an ECS cluster. It does **not** define the ECS services/tasks (api, web, worker, etc.); you add those (e.g. Fargate tasks and a load balancer) or use a separate template/CI.

### Steps (high level)

1. **Deploy base infra:**

   ```bash
   aws cloudformation deploy \
     --template-file deploy/aws/cloudformation.yml \
     --stack-name openfsm-prod \
     --parameter-overrides DBPassword=YOUR_SECURE_DB_PASSWORD
   ```

2. **Build and push images** to ECR.
3. **Add ECS services:**  
   Create task definitions and services for api, web, site, portal, worker. Point them to the RDS endpoint (from CloudFormation outputs) via `DATABASE_URL`. Put the API behind an ALB; use path rules so `/api` goes to the API tasks.
4. **Secrets:** Store `SESSION_SECRET`, `PORTAL_JWT_SECRET`, and DB URL in Secrets Manager or SSM and inject into tasks.
5. **Run migrations** once (task definition that runs migrate then exits, or run from a bastion/your machine with the RDS URL).

### Pricing (indicative)

- RDS (e.g. db.t3.micro): ~\$15–25/mo.
- ECS Fargate + ALB: ~\$30–70/mo for a few small tasks.
- Total often **~\$50–100/mo** for a minimal production setup.

### Pros and cons

- **Pros:** Scalable, integrates with IAM, VPC, and other AWS services.
- **Cons:** More moving parts; higher cost and operational complexity.

---

## 4. Google Cloud (Cloud Run + Cloud SQL)

Serverless containers with scale-to-zero; good if you prefer GCP or want pay-per-request.

### What’s in the repo

- **`deploy/gcp/cloud-run.yml`** — Example Knative/Cloud Run **Service** for the API only (image, port 4000, health check). You still need Cloud SQL (PostgreSQL 16), and separate services for web, site, portal, worker.

### Steps (high level)

1. **Create a Cloud SQL** PostgreSQL 16 instance and database `openfsm`. Note the connection name.
2. **Build and push images** to Artifact Registry (e.g. `REGION-docker.pkg.dev/PROJECT_ID/openfsm/api:latest`).
3. **Deploy the API to Cloud Run:**

   - Use the image and set `DATABASE_URL` (Cloud SQL Auth Proxy or private IP), `SESSION_SECRET`, `PORTAL_JWT_SECRET`, `CORS_ORIGIN`.
   - Replace `REGION` and `PROJECT_ID` in the sample YAML.

4. **Deploy web, site, portal** as separate Cloud Run services (or host static assets in Cloud Storage + CDN).
5. **Worker:** Run as a separate Cloud Run job (scheduled or always-on) or a small GCE/Compute instance that runs the worker process.
6. **Run migrations** once (Cloud Run job or Cloud Shell with Cloud SQL Proxy and `pnpm db:migrate`).

### Pricing (indicative)

- Cloud SQL: ~\$25–50/mo for a small instance.
- Cloud Run: pay per request and CPU time; can be **~\$5–30/mo** for low traffic.
- Total often **~\$30–80/mo** depending on traffic and worker strategy.

### Pros and cons

- **Pros:** Scale-to-zero, managed DB, strong GCP integration.
- **Cons:** More setup for worker and static assets; cold starts if scale-to-zero.

---

## 5. Comparison and recommendations

| Need | Suggested option |
|------|--------------------|
| Lowest cost, you’re OK with server admin | **Self-host (VPS + Docker)** |
| Easiest managed deploy, minimal DevOps | **DigitalOcean App Platform** |
| Already on AWS or need AWS compliance | **AWS ECS + RDS** |
| Prefer GCP or want serverless API | **GCP Cloud Run + Cloud SQL** |

### Common production checklist

- **Secrets:** Use strong random `SESSION_SECRET` and `PORTAL_JWT_SECRET`; never commit them.
- **Database:** Prefer managed Postgres (RDS, Cloud SQL, DO Managed DB) for backups and patches; or back up self-hosted Postgres regularly.
- **TLS:** Use a reverse proxy (Caddy, Nginx, or the platform’s LB) with HTTPS and redirect HTTP → HTTPS.
- **CORS:** Set `CORS_ORIGIN` to your real frontend origins (e.g. `https://admin.yourcompany.com`).
- **Storage:** For multi-instance or serverless, use S3-compatible storage instead of local disk; set `STORAGE_PROVIDER` and S3 env vars.
- **SMTP:** Configure SMTP (or a transactional provider) for estimates, invoices, and magic links.
- **Monitoring:** At minimum, health checks and log aggregation; add metrics (e.g. Prometheus) and alerts as you grow.

---

## Reference: deploy assets in this repo

| Path | Purpose |
|------|---------|
| `deploy/self-host/install.sh` | Generates `.env` and starts Docker Compose on a VPS |
| `deploy/self-host/caddy/Caddyfile` | Caddy reverse proxy for admin, portal, site, and API |
| `deploy/aws/cloudformation.yml` | VPC, RDS Postgres 16, ECS cluster (no task definitions) |
| `deploy/digitalocean/app-spec.yml` | App Platform: DB + api, web, worker services |
| `deploy/gcp/cloud-run.yml` | Sample Cloud Run service for the API only |
| `docker-compose.yml` | Full stack: postgres, api, worker, web, site, portal |

For step-by-step setup (local and Docker), see [SETUP_TUTORIAL.md](SETUP_TUTORIAL.md).
