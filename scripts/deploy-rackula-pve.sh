#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/rackula}"
RACKULA_HOST="${RACKULA_HOST:-192.168.77.210}"
RACKULA_PORT="${RACKULA_PORT:-8080}"
RACKULA_LISTEN_PORT="${RACKULA_LISTEN_PORT:-8080}"
RACKULA_API_PORT="${RACKULA_API_PORT:-3001}"

if command -v openssl >/dev/null 2>&1; then
  API_WRITE_TOKEN="$(openssl rand -hex 32)"
else
  API_WRITE_TOKEN="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
fi

sudo mkdir -p "${APP_DIR}/data"
cd "${APP_DIR}"

sudo curl -fsSL \
  https://raw.githubusercontent.com/RackulaLives/Rackula/main/deploy/docker-compose.persist.yml \
  -o docker-compose.yml

sudo tee "${APP_DIR}/.env" >/dev/null <<ENV
RACKULA_PORT=${RACKULA_PORT}
RACKULA_LISTEN_PORT=${RACKULA_LISTEN_PORT}
RACKULA_API_PORT=${RACKULA_API_PORT}
CORS_ORIGIN=http://${RACKULA_HOST}:${RACKULA_PORT}
ALLOW_INSECURE_CORS=false
RACKULA_AUTH_MODE=none
RACKULA_API_WRITE_TOKEN=${API_WRITE_TOKEN}
ENV

sudo chmod 600 "${APP_DIR}/.env"
sudo chown -R 1001:1001 "${APP_DIR}/data"

sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps

echo
echo "Rackula URL: http://${RACKULA_HOST}:${RACKULA_PORT}"
echo "App dir: ${APP_DIR}"
