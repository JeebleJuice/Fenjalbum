# Fenjalbum home-server runbook

Fenjalbum uses Git for application code only. Originals, derivatives, PostgreSQL data, production secrets, imports, and backups never belong in Git.

## Local development before deployment

Use the development computer for editing and testing. From a new checkout:

```bash
cd ~/Dev/Fenjalbum
npm install
cp .env.example .env
cp .env.local.example .env.local
npm run db:dev
npm run prisma:migrate:local
```

Set the administrator details and `SESSION_SECRET` in `.env` before the first database setup. On a normal development day, start the database and website in terminal 1:

```bash
cd ~/Dev/Fenjalbum
npm run db:dev
npm run dev
```

Open `http://localhost:3000`. Next.js automatically reloads frontend and ordinary server-code changes.

In terminal 2, run the media worker:

```bash
cd ~/Dev/Fenjalbum
npm run worker
```

The worker turns uploaded items from **Pending** into **Ready**. Restart it after changing worker or media-processing code. Stop either process with `Ctrl+C`; stop PostgreSQL without deleting its data with `npm run db:dev:stop`.

Before pushing changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The expanded local guide, including migrations and troubleshooting, is [`local-development.md`](local-development.md). The remainder of this runbook covers the production home server.

## First deployment

```bash
git clone https://github.com/JeebleJuice/Fenjalbum.git ~/fenjalbum
cd ~/fenjalbum
cp .env.production.example .env.production
mkdir -p storage/{media,thumbs,posters,tmp} import backups
chmod 700 storage import backups
TERM=xterm-256color nano .env.production
docker compose up -d --build
curl --fail http://127.0.0.1:3300/api/health
```

Generate the session secret with `openssl rand -base64 48`. Use a long unique administrator password. Use the same strong alphanumeric database password in `POSTGRES_PASSWORD` and the password portion of `DATABASE_URL`.

The default bind address is loopback for a reverse proxy or Cloudflare Tunnel. Route a private hostname such as `photos.jeeblejuice.dk` to `http://localhost:3300`, set `APP_URL` to that exact HTTPS URL, and keep `TRUST_PROXY=true`. For LAN-only direct access, set `FENJALBUM_BIND_ADDRESS=0.0.0.0`, `APP_URL=http://192.168.1.100:3300`, and `TRUST_PROXY=false`; restrict port 3300 to the local network with the server firewall.

## Updates

Develop, test, commit, and push on the development computer. On the server:

```bash
cd ~/fenjalbum
git pull --ff-only
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 web worker
```

Database migrations run automatically. Never edit application source on the server.

## Bulk import

Copy or mount source folders beneath the configured `FENJALBUM_IMPORT_ROOT` (default `./import`). The importer is recursive, preserves source files, deduplicates by SHA-256, and queues derivatives:

```bash
docker compose run --rm web npm run import -- /import
docker compose logs -f worker
```

Do not point the importer at the only copy of a library. Keep Immich running and import copies while validating dates, HEIC images, and videos.

## Backups

```bash
cd ~/fenjalbum
./scripts/backup-production.sh
```

Copy the resulting `backups/fenjalbum-*` directory to another physical device. A backup on the same laptop is not sufficient. Test restoration before treating Fenjalbum as the primary archive. Generated derivatives can be recreated, but the PostgreSQL dump and `originals.tar.gz` are essential.

## Phone use

Install the HTTPS site from Safari with **Share → Add to Home Screen**. The upload page accepts every item supplied by the system picker and Fenjalbum imposes no selection-count limit. Apple controls the iOS photo picker, so a web app cannot add a missing system-level “Select All” control or perform continuous background Camera Roll backup. For very large initial imports, export to the server import directory instead of selecting thousands of items in Safari.
