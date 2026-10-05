# Fenjalbum local development

Local development runs Next.js and the media worker directly on your computer so frontend changes reload immediately. Only PostgreSQL runs in Docker. Production uses the separate `docker-compose.yml` stack.

Always run these commands from the project directory:

```bash
cd ~/Dev/Fenjalbum
```

## First setup on a development computer

Install dependencies and create the local configuration files if they do not already exist:

```bash
npm install
cp .env.example .env
cp .env.local.example .env.local
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and a long random `SESSION_SECRET` in `.env`. Generate the secret with:

```bash
openssl rand -base64 48
```

`.env` contains container-facing defaults. `.env.local` overrides the database and storage locations when Next.js and the worker run directly on the computer. Do not commit either real environment file.

Start the development database and apply migrations:

```bash
npm run db:dev
npm run prisma:migrate:local
```

The database listens only on `127.0.0.1:5432`. Its data remains in the Docker volume when the container stops.

## Normal development day

Start PostgreSQL once:

```bash
cd ~/Dev/Fenjalbum
npm run db:dev
```

In terminal 1, start the website:

```bash
cd ~/Dev/Fenjalbum
npm run dev
```

Open <http://localhost:3000>. Frontend and server-code changes reload automatically.

In terminal 2, start media processing:

```bash
cd ~/Dev/Fenjalbum
npm run worker
```

The worker is required for pending uploads to become ready. Restart the worker after changing worker or media-processing code; ordinary frontend edits only need the development server.

Stop the website and worker with `Ctrl+C`. PostgreSQL may remain running. To stop it without deleting data:

```bash
npm run db:dev:stop
```

## After changing the Prisma schema

Create and apply a development migration:

```bash
npm run prisma:migrate:local -- --name describe_the_change
```

For checked-in migrations that only need applying:

```bash
npm run prisma:deploy:local
```

These commands deliberately load `.env.local`; plain `npx prisma migrate ...` would otherwise try the Docker-only hostname `db` from `.env`.

## Checks before pushing

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Useful diagnostics

Check PostgreSQL:

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs --tail=100 db
```

Check which process owns a port:

```bash
ss -ltnp | grep -E ':3000|:5432'
```

If uploads stay **Pending**, the worker is not running or cannot reach PostgreSQL. Read the worker terminal first.

Do not run `docker compose down -v` unless you intentionally want to delete the local database volume. Uploaded development files live under `data/` and are ignored by Git.
