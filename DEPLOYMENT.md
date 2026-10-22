# Azaroth Tech-Hive — Customer-Owned Deployment & Operations Guide

## 1. System Architecture
Azaroth Tech-Hive is an enterprise corporate website and visual content management platform built with:
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Express on Node.js with Vite dev middleware.
- **Authoritative Database**: Neon PostgreSQL (with SSL), featuring automatic non-destructive schema migrations and a zero-crash local persistent fallback in `data/db.json`.
- **Media Object Storage**: Three deployment modes selected by `MEDIA_STORAGE_MODE`: `local` (local disk), `test` (isolated local disk — never S3), and `prod` (S3-compatible object store, e.g. Cloudflare R2). All paths use server-side mime-type validation, SVG sanitization, and path-traversal-safe filenames.

---

## 2. Environment Variables (.env)

Copy one of the committed templates to `.env`:

```bash
cp .env.local .env     # development
cp .env.test  .env     # Vercel test / CI
cp .env.prod  .env     # production (Cloudflare R2)
```

Key configuration parameters:
- `MEDIA_STORAGE_MODE`: `local` (default), `test`, or `prod`. This is the authoritative switch. `test` forces local disk and **ignores all `S3_*` variables**, so a test deployment can never write to the production bucket.
- `MEDIA_STORAGE`: Legacy single flag (`disk`/`s3`). Only used when `MEDIA_STORAGE_MODE` is unset. Prefer `MEDIA_STORAGE_MODE`.
- `DATABASE_URL`: Connection string to your Neon PostgreSQL cluster.
- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USERNAME`, `BREVO_SMTP_PASSWORD`: Brevo SMTP credentials.
- `CONTACT_NOTIFICATION_EMAIL`: Target address for new contact enquiries and chatbot leads.
- `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`: Credentials used only to provision the initial administrator when one does not already exist.
- `JWT_SECRET`: A unique, strong secret used to sign authentication tokens.
- `MAX_FILE_SIZE_MB`: Maximum upload size in megabytes (default `50`).
- `UPLOAD_DIR`: Local upload directory when using local disk.
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: Required for `MEDIA_STORAGE_MODE=prod`.
- `S3_ENDPOINT`: Optional custom endpoint, such as a Cloudflare R2 or MinIO URL.
- `S3_R2`: Set `true` when using Cloudflare R2. When set, the region is forced to `auto` and path-style URLs are forced (R2 rejects virtual-hosted style). Defaults to `true` automatically when `S3_ENDPOINT` points at `*.r2.cloudflarestorage.com`.
- `S3_PUBLIC_BASE_URL`: Public CDN/bucket URL prepended to uploaded object keys. The bucket or CDN must allow public `GET`; private buckets require an external signed-URL layer.
- `S3_PREFIX`: Object-key prefix (default `uploads`).
- `S3_FORCE_PATH_STYLE`: Set `true` for MinIO or providers that require path-style URLs. Defaults to `true` when `S3_ENDPOINT` is set (and is always `true` for R2).
- `S3_SESSION_TOKEN`: Optional temporary-session token.

### Cloudflare R2

Cloudflare R2 is an S3-compatible object store. It is **not** plain S3, so a working local disk upload does not prove a working R2 upload:

- **Region must be `auto`.** R2 rejects requests signed with `us-east-1` (the code default) with a `403` signature-mismatch. Set `S3_REGION=auto` or `S3_R2=true` and the region is forced to `auto` automatically.
- **URL style must be path-style.** R2 does not support virtual-hosted style buckets. `S3_FORCE_PATH_STYLE` is forced to `true` for R2 automatically.
- **Public URLs need `S3_PUBLIC_BASE_URL`.** R2 has no public `https://<bucket>.<region>.amazonaws.com` form. Set `S3_PUBLIC_BASE_URL=https://<your-custom-domain>` (or the `r2.dev` dev URL) so stored media resolves to a reachable URL.

```bash
MEDIA_STORAGE_MODE=prod
S3_R2=true
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.yourdomain.com
S3_PREFIX=uploads
```

The server logs a warning at startup if an R2 endpoint is detected with the wrong region or URL style, so a misconfiguration is visible before the first upload.

### Cloudflare R2

Cloudflare R2 is an S3-compatible object store. It is **not** plain S3, so a working local disk upload does not prove a working R2 upload:

- **Region must be `auto`.** R2 rejects requests signed with `us-east-1` (the code default) with a `403` signature-mismatch. Set `S3_REGION=auto` or `S3_R2=true` and the region is forced to `auto` automatically.
- **URL style must be path-style.** R2 does not support virtual-hosted style buckets. `S3_FORCE_PATH_STYLE` is forced to `true` for R2 automatically.
- **Public URLs need `S3_PUBLIC_BASE_URL`.** R2 has no public `https://<bucket>.<region>.amazonaws.com` form. Set `S3_PUBLIC_BASE_URL=https://<your-custom-domain>` (or the `r2.dev` dev URL) so stored media resolves to a reachable URL.

```bash
MEDIA_STORAGE=s3
S3_R2=true
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.yourdomain.com
S3_PREFIX=uploads
```

The server logs a warning at startup if an R2 endpoint is detected with the wrong region or URL style, so a misconfiguration is visible before the first upload.

---

## 3. Deployment via Docker & Compose

### Option A: Docker Compose (Recommended)
```bash
# Build and start services in the background
docker-compose up -d --build

# Inspect running logs
docker-compose logs -f
```

### Option B: Native Docker
```bash
# Build production image
docker build -t azaroth-tech-hive:latest .

# Run container
docker run -d \
  -p 8080:3000 \
  -e DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require" \
  -e BREVO_SMTP_HOST="smtp-relay.brevo.com" \
  -e BREVO_SMTP_PORT=587 \
  -e BREVO_SMTP_USERNAME="your-brevo-username" \
  -e BREVO_SMTP_PASSWORD="your-brevo-password" \
  -e CONTACT_NOTIFICATION_EMAIL="azarothtechhive@gmail.com" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  --name azaroth-app \
  azaroth-tech-hive:latest
```

---

## 4. Initial Administrator Access
Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and `JWT_SECRET` in the deployment environment before starting the application. On first launch, the system provisions an administrator only if that email is not already present. These values do not authenticate a visitor; administrators must sign in at `http://localhost:8080/admin/login`.

---

## 5. Health Check & Monitoring
The health endpoint is exposed at:
```http
GET /api/health
```
Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-19T14:30:00.000Z",
  "database": {
    "type": "neon-postgresql",
    "connected": true,
    "productsCount": 4,
    "leadsCount": 12
  },
  "smtpConfigured": true,
  "mediaStorage": "disk",
  "version": "1.0.0"
}
```

---

## 6. Backup & Restoration Procedures

### Database Backup (Neon PostgreSQL):
```bash
pg_dump "$DATABASE_URL" -Fc > backup_azaroth_$(date +%Y%m%d).dump
```

### Database Restoration:
```bash
pg_restore -d "$DATABASE_URL" -c --if-exists backup_azaroth_YYYYMMDD.dump
```

### Media Volume Backup:
```bash
tar -czvf media_backup_$(date +%Y%m%d).tar.gz ./uploads
```

---

## 7. Schema & Data Migrations
PostgreSQL schema changes are defined in `src/server/migrations.ts` and tracked in `ath_schema_migrations`. Pending migrations run in version order inside individual transactions on startup; version `1` is the baseline schema and version `2` adds the media upload index. Applied versions are never re-run.

Settings reads and writes are also normalized so legacy footer `columns[]` data is upgraded to the canonical `sections[]` model without deleting the original columns. Back up the database before applying future migration versions. Local fallback data is stored in `data/db.json`; disk media files are stored in `uploads/`.

---

## 8. Automated Verification
Run these before every deployment:

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
```

`npm run test:e2e` builds the production bundle, starts an isolated local server with a temporary data directory, and runs Chromium tests for navbar overlay transparency, footer publishing, mobile navigation, disabled social links, RTL footer alignment, and visual snapshots of the desktop overlay navbar and mobile drawer. It never reads `DATABASE_URL` or production admin credentials.

Visual baselines are platform-specific and currently committed for Windows Chromium. Regenerate them on the target platform with `npm run test:e2e:update`; on other platforms the snapshot tests are skipped rather than producing false failures.

---

## 9. Serverless Platform Constraints

### Media Object Storage
For Vercel, Cloudflare R2, or any platform without persistent disk, set `MEDIA_STORAGE=s3` and provide the `S3_*` credentials. Uploads are written to the bucket and the public `url` stored in `ath_media` points at either `S3_PUBLIC_BASE_URL` or the bucket endpoint. `S3_PUBLIC_BASE_URL` must be reachable by browsers and allow `GET` for the configured `S3_PREFIX`.

When `MEDIA_STORAGE` is unset, uploads continue to use `UPLOAD_DIR`; mount a persistent volume for `/uploads` in Docker or on a VPS. Existing `/uploads/*` media records keep working in disk mode.

### Vercel
`vercel.json` and `api/index.ts` can serve the Express API. Vercel functions have an ephemeral filesystem, so `MEDIA_STORAGE=disk` is not durable there and uploaded files disappear between invocations. Configure `MEDIA_STORAGE=s3` and a public bucket/CDN URL before deploying to Vercel. The database layer still requires a reachable PostgreSQL connection.

If you cannot use object storage, deploy with Docker and mount persistent volumes for `data/` and `uploads/` instead.

### Cloudflare Pages
Cloudflare Pages is a static/edge-rendering platform and cannot run this Express server, Neon connection pool, multer uploads, or local media storage as-is. Do not point a Pages project at this repository expecting `/api/*` to work. Use a Node-capable host (Docker, Render, Railway, Fly.io, or a VPS) or build a separate serverless API adapter before using Pages for the frontend.

---

## 10. Production Checklist
- Set a strong, unique `JWT_SECRET` and non-default `INITIAL_ADMIN_PASSWORD`.
- Configure `DATABASE_URL` with SSL and verify `/api/health` reports `neon-postgresql`.
- Mount persistent storage for `uploads/`, or set `MEDIA_STORAGE=s3` plus the `S3_*` variables and verify a real upload/delete round-trip.
- Verify Media Library upload, display-name change, authenticated download, and delete in the deployed environment. Renaming changes the CMS display name only; it does not move the stored object or change URLs already used by pages.
- Run `npm run lint`, all test suites, and `npm run build` against the exact commit being deployed.
- Verify the test administrator account is not reused in production.
- Review content drafts, then publish from the CMS; draft edits are never public until explicitly published.
