#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
backup_root="${BACKUP_ROOT:-./backups}"
storage_root="${FENJALBUM_STORAGE_ROOT:-./storage}"
stamp="$(date +%Y%m%d-%H%M%S)"
destination="$backup_root/fenjalbum-$stamp"
mkdir -p "$destination"
docker compose exec -T db pg_dump -U fenjalbum -d fenjalbum --format=custom > "$destination/database.dump"
tar -C "$storage_root" -czf "$destination/originals.tar.gz" media
tar -C "$storage_root" -czf "$destination/derivatives.tar.gz" thumbs posters
printf 'Fenjalbum backup %s\nRestore database with pg_restore and restore storage archives before starting web/worker.\n' "$stamp" > "$destination/README.txt"
echo "Backup written to $destination"
