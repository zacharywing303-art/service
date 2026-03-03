#!/usr/bin/env bash
set -euo pipefail

echo "=== OpenFSM Self-Host Installer ==="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    echo "  https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "Error: Docker Compose v2 is required."
    exit 1
fi

# Prompt for domain
read -p "Enter your domain (or press Enter for localhost): " DOMAIN
DOMAIN="${DOMAIN:-localhost}"

# Generate secrets
SESSION_SECRET=$(openssl rand -hex 32)
PORTAL_JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Create .env
cat > .env <<EOF
DOMAIN=${DOMAIN}
POSTGRES_USER=openfsm
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=openfsm
DATABASE_URL=postgresql://openfsm:${POSTGRES_PASSWORD}@postgres:5432/openfsm
API_PORT=4000
API_HOST=0.0.0.0
SESSION_SECRET=${SESSION_SECRET}
PORTAL_JWT_SECRET=${PORTAL_JWT_SECRET}
CORS_ORIGIN=https://${DOMAIN},https://admin.${DOMAIN},https://portal.${DOMAIN}
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads
EOF

echo ""
echo "Configuration written to .env"
echo ""

# Pull and start
echo "Starting OpenFSM..."
docker compose up -d

echo ""
echo "=== OpenFSM is running! ==="
echo "  Admin:  https://admin.${DOMAIN}"
echo "  Site:   https://${DOMAIN}"
echo "  Portal: https://portal.${DOMAIN}"
echo "  API:    https://admin.${DOMAIN}/api"
echo ""
echo "Run 'docker compose logs -f' to view logs."
