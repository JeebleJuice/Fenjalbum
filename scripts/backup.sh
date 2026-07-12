#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ROOT:?Set BACKUP_ROOT to the directory where backups should be written}"
: "${DATABASE_URL:?Set DATABASE_URL}"
: "${MEDIA_ROOT:?Set MEDIA_ROOT}"
: "${THUMB_ROOT:?Set THUMB_ROOT}"
: "${POSTER_ROOT:?Set POSTER_ROOT}"

timestamp="$(date +%Y%m%d-%H%M%S)"
dest="${BACKUP_ROOT%/}/fenjalbum-${timestamp}"
mkdir -p "$dest"

pg_dump "$DATABASE_URL" --format=custom --file="$dest/database.dump"
tar -C "$(dirname "$MEDIA_ROOT")" -czf "$dest/media.tar.gz" "$(basename "$MEDIA_ROOT")"
tar -C "$(dirname "$THUMB_ROOT")" -czf "$dest/thumbs.tar.gz" "$(basename "$THUMB_ROOT")"
tar -C "$(dirname "$POSTER_ROOT")" -czf "$dest/posters.tar.gz" "$(basename "$POSTER_ROOT")"

cat > "$dest/README.txt" <<EOF
Backup created at: $timestamp
Contains:
- PostgreSQL custom dump
- Original media files
- Generated thumbnails
- Generated posters
EOF

echo "Backup written to $dest"
