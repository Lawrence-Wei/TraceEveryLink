#!/usr/bin/env sh
set -eu

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE:-}"

if [ -z "$PASSPHRASE" ]; then
  echo "BACKUP_ENCRYPTION_PASSPHRASE is required" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-patchplan}" \
  -d "${POSTGRES_DB:-patchplan}" \
  | gzip \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:$PASSPHRASE" \
  > "$BACKUP_DIR/patchplan-db-$STAMP.sql.gz.enc"

docker run --rm \
  -v "patchplan_photo_storage:/photos:ro" \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine sh -c "tar -czf - /photos" \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:$PASSPHRASE" \
  > "$BACKUP_DIR/patchplan-photos-$STAMP.tar.gz.enc"

find "$BACKUP_DIR" -type f -mtime +30 -name "patchplan-*.enc" -delete
