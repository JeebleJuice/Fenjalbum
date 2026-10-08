# Fenjalbum

Private, self-hostable photo and video album app built with Next.js, TypeScript, Prisma, PostgreSQL, Tailwind, and Docker.

## Screenshots

Add preview images to `screenshots/` if you want to show the UI in the repository.

## What this is

Fenjalbum is a private media library for a home server or local machine.

- Every page is protected behind login.
- Media is never exposed from a public static directory.
- Files are served through authenticated routes.
- Original media stays on disk; thumbnails and posters are generated separately.
- HEIC/HEIF files are converted for display, EXIF dates and GPS coordinates are retained, and incompatible video containers receive browser-friendly playback copies.
- Deletion uses a recoverable administrator trash instead of immediately removing originals.
- Uploads, metadata extraction, and thumbnail generation are designed for local/offline use after dependencies are installed.

## Architecture

- Frontend: Next.js App Router, React, Tailwind CSS, custom polished UI primitives.
- Auth: secure cookie-based session with JWT and CSRF protection.
- Database: PostgreSQL with Prisma ORM.
- Storage: local filesystem for originals, thumbnails, posters, and temp uploads.
- Media processing: Sharp for images, FFmpeg/ffprobe for videos.
- Background work: a small polling worker processes queued media jobs.
- Deployment: Dockerfile + docker-compose with persistent volumes.

## Folder structure

- `app/` routes, pages, and API handlers
- `components/` shared UI and client-side interactions
- `lib/` auth, storage, security, media processing, upload helpers
- `prisma/` schema, seed script, and migrations
- `scripts/` worker and backup utilities
- `tests/` unit tests for auth, range requests, upload validation, and filters

## Authentication flow

1. The first administrator is created from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.
2. Login is handled on `/login`.
3. A secure HTTP-only session cookie is issued after successful auth.
4. A CSRF cookie is also set and required for state-changing requests.
5. All application routes, API routes, and media routes are protected by middleware or server-side checks.
6. Logout clears the session and CSRF cookies.

## Storage and media flow

- Uploaded files arrive through a streamed multipart upload endpoint.
- Files are written to a temporary upload directory first.
- On iOS, photos and videos use separate inputs so video selection avoids WebKit's unreliable multiple-media picker path.
- A SHA-256 hash is used for duplicate detection.
- Originals are moved into the configured media storage root using normalized filenames.
- A background worker extracts metadata and generates image thumbnails or video posters.
- Media is streamed back through authenticated API routes that support safe range requests for video playback.

## Primary user flows

- Login and logout
- Responsive sidebar navigation with active-page highlighting and a mobile drawer
- Database-driven Discover page with recent media and album highlights
- Browse the complete Library
- Filter by photo/video, album, favorites, text, exact dates, date ranges, and sort order
- Explore geotagged media on an interactive OpenStreetMap map with nearby items grouped together
- Open full-screen photo and video viewer
- Upload one or many files
- Upload an entire browser-supported folder or recursively import a server directory
- Create, rename, and manage albums
- Add the same photo or video to multiple albums without duplicating the stored original
- Mark items as favorites
- Admin review of media, albums, and settings
- Retry failed processing jobs
- Change the administrator password

## Docker deployment

Build and start everything with:

```bash
docker compose up -d --build
```

The compose stack includes:

- `web` application container
- `worker` background processor container
- `db` PostgreSQL container

The app expects these persistent volumes:

- PostgreSQL data
- Original media
- Thumbnails
- Posters
- Temporary upload workspace

If you are running behind a reverse proxy, set `APP_URL` to your HTTPS public URL and configure proxy headers correctly.

## Local development

The full first-run and everyday workflow is in [`docs/local-development.md`](docs/local-development.md). In short, PostgreSQL runs in Docker while Next.js and the worker run directly on the development computer:

```bash
npm install
npm run db:dev
npm run prisma:migrate:local
npm run dev
```

Run the worker in a second terminal so uploaded items are processed:

```bash
npm run worker
```

Copy `.env.local.example` to `.env.local` on a new development computer. The local Prisma scripts, worker, and seed process load `.env.local` after `.env`, so host-specific database and storage paths override container defaults correctly.

Production build:

```bash
npm run build
```

Type check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Tests:

```bash
npm test
```

## Environment variables

Copy `.env.example` to `.env` and adjust values.

- `APP_URL`: canonical application URL, used for cookie security and redirects
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: long random secret for session signing
- `ADMIN_EMAIL`: first admin email
- `ADMIN_PASSWORD`: first admin password
- `ADMIN_NAME`: first admin display name
- `MEDIA_ROOT`: filesystem path for originals
- `THUMB_ROOT`: filesystem path for generated thumbnails
- `POSTER_ROOT`: filesystem path for generated video posters
- `UPLOAD_TMP_ROOT`: filesystem path for temporary upload files
- `MAX_UPLOAD_MB`: per-request upload size limit
- `RATE_LIMIT_WINDOW_MS`: rate limit window in milliseconds
- `RATE_LIMIT_LOGIN_MAX`: login attempts per window
- `MAX_CONCURRENT_UPLOADS`: simultaneous upload requests allowed per client; queued files are not count-limited
- `TRUST_PROXY`: whether to trust reverse-proxy headers
- `SEED_DEMO`: optional demo seed mode for development only
- `WORKER_POLL_MS`: background worker polling interval

## Default setup

1. Create a `.env` file from `.env.example`.
2. Set a strong `SESSION_SECRET`.
3. Set the initial administrator email and password.
4. Ensure the media directories exist or let the app create them.
5. Start the stack with `docker compose up -d --build`.
6. Open the app and log in with the admin credentials.

## Backup strategy

Back up these pieces separately:

- PostgreSQL database
- Original media files
- Generated thumbnails
- Generated posters
- App configuration

Example backup script:

```bash
BACKUP_ROOT=/backups \
DATABASE_URL="postgresql://..." \
MEDIA_ROOT=/data/media \
THUMB_ROOT=/data/thumbs \
POSTER_ROOT=/data/posters \
./scripts/backup.sh
```

The repository includes `scripts/backup.sh`, which creates:

- a custom-format PostgreSQL dump
- tar archives for originals, thumbnails, and posters

## Restore procedure

1. Stop the application containers.
2. Restore media, thumbnails, and posters into their configured locations.
3. Restore the PostgreSQL dump using `pg_restore`.
4. Start the stack again.

Example:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" /path/to/database.dump
```

If you are restoring onto a fresh server, restore the database first, then media files.

## Security notes

Threat model:

- The app is meant for trusted home-network use, but it still assumes untrusted browsers and potential network attackers.
- All media endpoints require authentication.
- Sessions use HTTP-only cookies.
- State-changing requests require CSRF tokens.
- Filenames are normalized and path traversal is blocked.
- Uploads are restricted by MIME signature and file type validation.
- Login attempts are rate limited. Authenticated uploads use a bounded queue and a
  per-client concurrency cap, allowing large selections without overloading the server.
- The upload endpoint performs its own session, CSRF, and concurrency checks and
  intentionally bypasses Next.js Proxy so large videos stream to temporary
  storage instead of being truncated by Proxy's request-body buffer.

Limitations:

- Rate limiting is in-memory, so it resets on process restart and is not shared across multiple app instances.
- The worker is intentionally simple and is best used as a single replica.
- Videos that are not already browser-friendly receive an H.264/AAC playback derivative while the original remains untouched.

## Recommended next improvements

1. Add an optional native iOS/Android client for continuous background Camera Roll backup.
2. Add map and face/object-search views on top of the stored EXIF metadata.
3. Add a stronger distributed rate limiter if you scale beyond one instance.
4. Add a guided restore screen and automated off-device backup target.

The complete production workflow is documented in [`docs/home-server.md`](docs/home-server.md).

## License

MIT
