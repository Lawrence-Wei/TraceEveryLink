#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="${APP_NAME:-patchplan}"
ORIGINAL_ARGS=("$@")
APP_DIR="${APP_DIR:-/opt/patchplan}"
APP_USER="${APP_USER:-patchplan}"
APP_PORT="${APP_PORT:-3000}"
DEPLOY_MODE="${DEPLOY_MODE:-docker}"
APP_DOMAIN="${APP_DOMAIN:-localhost}"
REPO_URL="${REPO_URL:-}"
REPO_REF="${REPO_REF:-main}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_MFA_ENABLED="${ADMIN_MFA_ENABLED:-false}"
POSTGRES_DB="${POSTGRES_DB:-patchplan}"
POSTGRES_USER="${POSTGRES_USER:-patchplan}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
SESSION_SECRET="${SESSION_SECRET:-}"
BACKUP_ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE:-}"
RUN_SEED="${RUN_SEED:-true}"
INSTALL_NGINX="${INSTALL_NGINX:-true}"

usage() {
  cat <<'EOF'
TraceEveryLink Linux installer

Usage:
  sudo ./scripts/install-linux.sh [options]

Options:
  --mode docker|native       Deployment mode. Default: docker
  --dir PATH                 Install directory. Default: /opt/patchplan
  --domain DOMAIN            Public domain or IP. Default: localhost
  --port PORT                Native app port. Default: 3000
  --repo URL                 Optional Git repository URL to clone/update
  --ref BRANCH_OR_TAG        Git ref when --repo is used. Default: main
  --admin-email EMAIL        Initial admin email. Default: admin@example.com
  --admin-password PASSWORD  Initial admin password. Generated if omitted
  --skip-seed                Do not run the seed step
  -h, --help                 Show this help

Environment variables with the same names as the options are also supported.

Examples:
  sudo ./scripts/install-linux.sh --mode docker --domain patchplan.example.com
  sudo ./scripts/install-linux.sh --mode native --domain 10.10.10.50
  curl -fsSL https://example.com/install-linux.sh | sudo REPO_URL=https://github.com/you/TraceEveryLink bash -s -- --mode docker
EOF
}

log() {
  printf '\033[1;34m==>\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33mWARN:\033[0m %s\n' "$*" >&2
}

die() {
  printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode)
      DEPLOY_MODE="${2:-}"
      shift 2
      ;;
    --dir)
      APP_DIR="${2:-}"
      shift 2
      ;;
    --domain)
      APP_DOMAIN="${2:-}"
      shift 2
      ;;
    --port)
      APP_PORT="${2:-}"
      shift 2
      ;;
    --repo)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --ref)
      REPO_REF="${2:-}"
      shift 2
      ;;
    --admin-email)
      ADMIN_EMAIL="${2:-}"
      shift 2
      ;;
    --admin-password)
      ADMIN_PASSWORD="${2:-}"
      shift 2
      ;;
    --skip-seed)
      RUN_SEED="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

[ "$DEPLOY_MODE" = "docker" ] || [ "$DEPLOY_MODE" = "native" ] || die "--mode must be docker or native"

if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "${ORIGINAL_ARGS[@]}"
  fi
  die "Run as root or install sudo."
fi

[ -r /etc/os-release ] || die "Cannot detect Linux distribution."
# shellcheck disable=SC1091
. /etc/os-release
OS_ID="${ID:-}"
OS_LIKE="${ID_LIKE:-}"

is_ubuntu() {
  [ "$OS_ID" = "ubuntu" ] || printf '%s' "$OS_LIKE" | grep -Eq '(^| )debian( |$)|(^| )ubuntu( |$)'
}

is_fedora() {
  [ "$OS_ID" = "fedora" ] || printf '%s' "$OS_LIKE" | grep -Eq '(^| )fedora( |$)|(^| )rhel( |$)'
}

if ! is_ubuntu && ! is_fedora; then
  die "Unsupported distro: ${PRETTY_NAME:-unknown}. This installer supports Ubuntu/Debian-like and Fedora/RHEL-like systems."
fi

pkg_update() {
  if is_ubuntu; then
    apt-get update
  else
    dnf -y makecache
  fi
}

pkg_install() {
  if is_ubuntu; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
  else
    dnf install -y "$@"
  fi
}

random_secret() {
  openssl rand -base64 "${1:-32}" | tr -d '\n'
}

public_url() {
  if [ "$APP_DOMAIN" = "localhost" ] || [ "$APP_DOMAIN" = "127.0.0.1" ]; then
    if [ "$DEPLOY_MODE" = "native" ]; then
      printf 'http://%s:%s' "$APP_DOMAIN" "$APP_PORT"
    else
      printf 'https://%s' "$APP_DOMAIN"
    fi
  elif [ "$DEPLOY_MODE" = "docker" ]; then
    printf 'https://%s' "$APP_DOMAIN"
  else
    printf 'http://%s' "$APP_DOMAIN"
  fi
}

create_app_user() {
  if id "$APP_USER" >/dev/null 2>&1; then
    return
  fi

  log "Creating system user $APP_USER"
  local nologin_shell
  nologin_shell="$(command -v nologin || printf '/usr/sbin/nologin')"
  useradd --system --create-home --home-dir "/var/lib/$APP_USER" --shell "$nologin_shell" "$APP_USER"
}

install_base_packages() {
  log "Installing base packages"
  pkg_update
  if is_ubuntu; then
    pkg_install ca-certificates curl git openssl rsync tar
  else
    pkg_install ca-certificates curl git openssl rsync tar shadow-utils
  fi
}

prepare_app_dir() {
  log "Preparing application directory: $APP_DIR"
  mkdir -p "$APP_DIR"

  if [ -n "$REPO_URL" ]; then
    if [ -d "$APP_DIR/.git" ]; then
      git -C "$APP_DIR" fetch --all --tags
      git -C "$APP_DIR" checkout "$REPO_REF"
      git -C "$APP_DIR" pull --ff-only || true
    else
      rm -rf "$APP_DIR"
      git clone --branch "$REPO_REF" "$REPO_URL" "$APP_DIR"
    fi
  else
    local source_dir
    source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    [ -f "$source_dir/package.json" ] || die "Run this script from the TraceEveryLink repository, or pass --repo."
    rsync -a \
      --exclude '.git' \
      --exclude '.next' \
      --exclude 'node_modules' \
      --exclude 'storage' \
      --exclude 'backups' \
      --exclude '.env' \
      --exclude '.env.*' \
      "$source_dir/" "$APP_DIR/"
  fi

  [ -f "$APP_DIR/package.json" ] || die "package.json not found in $APP_DIR"
}

write_env_file() {
  [ -n "$POSTGRES_PASSWORD" ] || POSTGRES_PASSWORD="$(random_secret 24)"
  [ -n "$SESSION_SECRET" ] || SESSION_SECRET="$(random_secret 48)"
  [ -n "$BACKUP_ENCRYPTION_PASSPHRASE" ] || BACKUP_ENCRYPTION_PASSPHRASE="$(random_secret 32)"
  [ -n "$ADMIN_PASSWORD" ] || ADMIN_PASSWORD="$(random_secret 18)"

  local app_url db_url photo_dir
  app_url="$(public_url)"
  if [ "$DEPLOY_MODE" = "docker" ]; then
    db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"
    photo_dir="/app/storage/photos"
  else
    db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
    photo_dir="$APP_DIR/storage/photos"
  fi

  log "Writing $APP_DIR/.env"
  cat > "$APP_DIR/.env" <<EOF
APP_DOMAIN="${APP_DOMAIN}"
RUN_SEED="${RUN_SEED}"
DATABASE_URL="${db_url}"
NEXT_PUBLIC_APP_URL="${app_url}"
APP_URL="${app_url}"
SESSION_SECRET="${SESSION_SECRET}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_MFA_ENABLED="${ADMIN_MFA_ENABLED}"
ADMIN_TOTP_SECRET="JBSWY3DPEHPK3PXP"
PHOTO_STORAGE_DIR="${photo_dir}"
BACKUP_ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE}"
OAUTH_AUTO_PROVISION="true"
ALLOWED_EMAIL_DOMAINS=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
CISCO_CLIENT_ID=""
CISCO_CLIENT_SECRET=""
CISCO_OIDC_ISSUER=""
CISCO_AUTHORIZATION_URL=""
CISCO_TOKEN_URL=""
CISCO_USERINFO_URL=""
POSTGRES_DB="${POSTGRES_DB}"
POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
EOF
  chmod 600 "$APP_DIR/.env"
}

install_docker_engine() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker and Compose are already installed"
    return
  fi

  log "Installing Docker and Docker Compose"
  if is_ubuntu; then
    pkg_install docker.io docker-compose-plugin || pkg_install docker.io docker-compose-v2 || true
  else
    pkg_install moby-engine docker-compose-plugin || pkg_install docker docker-compose-plugin || true
  fi

  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    warn "Distribution packages did not provide Docker Compose v2. Falling back to Docker's official convenience installer."
    curl -fsSL https://get.docker.com | sh
  fi

  systemctl enable --now docker
  docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is not available after installation."
}

deploy_docker() {
  install_docker_engine
  log "Building and starting Docker services"
  (
    cd "$APP_DIR"
    docker compose up -d --build
    docker compose ps
  )
}

install_nodejs() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || printf 0)"
    if [ "$major" -ge 20 ]; then
      log "Node.js $(node --version) is already installed"
      return
    fi
  fi

  log "Installing Node.js 22"
  if is_ubuntu; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    pkg_install nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    pkg_install nodejs
  fi

  command -v node >/dev/null 2>&1 || die "Node.js installation failed."
}

install_postgres() {
  log "Installing PostgreSQL"
  if is_ubuntu; then
    pkg_install postgresql postgresql-contrib
  else
    pkg_install postgresql-server postgresql-contrib
    if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
      postgresql-setup --initdb
    fi
  fi
  systemctl enable --now postgresql
}

sql_literal() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/''/g")"
}

setup_postgres_db() {
  log "Configuring PostgreSQL database"
  local pass_sql
  pass_sql="$(sql_literal "$POSTGRES_PASSWORD")"

  runuser -u postgres -- psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
    CREATE ROLE "${POSTGRES_USER}" LOGIN PASSWORD ${pass_sql};
  ELSE
    ALTER ROLE "${POSTGRES_USER}" WITH PASSWORD ${pass_sql};
  END IF;
END
\$\$;
SQL

  if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1; then
    runuser -u postgres -- createdb -O "$POSTGRES_USER" "$POSTGRES_DB"
  fi
}

run_as_app_user() {
  runuser -u "$APP_USER" -- env HOME="/var/lib/$APP_USER" bash -lc "$*"
}

deploy_native() {
  create_app_user
  install_nodejs
  install_postgres
  setup_postgres_db

  mkdir -p "$APP_DIR/storage/photos"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR" "/var/lib/$APP_USER"

  log "Installing Node dependencies and building TraceEveryLink"
  run_as_app_user "cd '$APP_DIR' && npm ci && set -a && . ./.env && set +a && npm run build && npm run db:push"

  if [ "$RUN_SEED" = "true" ]; then
    log "Seeding database"
    run_as_app_user "cd '$APP_DIR' && set -a && . ./.env && set +a && npm run db:seed"
  fi

  local npm_bin
  npm_bin="$(command -v npm)"

  log "Writing systemd service"
  cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=TraceEveryLink network cabling workspace
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
ExecStart=${npm_bin} run start
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable --now "${APP_NAME}.service"

  if [ "$INSTALL_NGINX" = "true" ]; then
    configure_nginx
  fi
}

configure_nginx() {
  log "Configuring Nginx reverse proxy"
  pkg_install nginx
  cat > /etc/nginx/conf.d/patchplan.conf <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx
}

print_summary() {
  local app_url
  app_url="$(public_url)"
  cat <<EOF

TraceEveryLink installation complete.

URL:          ${app_url}
Install dir:  ${APP_DIR}
Mode:         ${DEPLOY_MODE}
Admin email:  ${ADMIN_EMAIL}
Admin pass:   ${ADMIN_PASSWORD}

Keep this password now. It is stored in ${APP_DIR}/.env and can be changed later.
EOF

  if [ "$DEPLOY_MODE" = "native" ]; then
    cat <<EOF

Useful commands:
  systemctl status ${APP_NAME}
  journalctl -u ${APP_NAME} -f
  systemctl restart ${APP_NAME}
EOF
  else
    cat <<EOF

Useful commands:
  cd ${APP_DIR} && docker compose ps
  cd ${APP_DIR} && docker compose logs -f app
  cd ${APP_DIR} && docker compose down
EOF
  fi
}

main() {
  install_base_packages
  prepare_app_dir
  write_env_file

  if [ "$DEPLOY_MODE" = "docker" ]; then
    deploy_docker
  else
    deploy_native
  fi

  print_summary
}

main
