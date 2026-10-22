# Azaroth CMS — Standalone Integration Module

This package extracts the CMS application and its supporting backend, database layer, authentication, media handling, admin UI, migrations, tests, and deployment configuration from the supplied project.

## Important: safe integration model

**Do not copy these files over the root of your new website.** This CMS is a standalone React + Express application, not a drop-in component or framework-neutral plugin. Its admin UI and API are coupled to the included app/server and currently use same-origin `/api/*` routes. The safest approach is to run it as a separate service and connect the new site's content layer to its API. This avoids overwriting the new site's routes, package manifest, CSS, assets, or server.

Suggested layout:

- Public site: `https://www.example.com`
- CMS/admin service: `https://cms.example.com`
- CMS admin login: `https://cms.example.com/admin/login`
- CMS API: `https://cms.example.com/api/*`
- CMS media: `https://cms.example.com/uploads/*` (or your configured public object-storage URL)

The included public pages are retained because the current CMS project uses them for its existing preview/rendering behavior and shared app shell. They are not intended to replace the new site's public pages.

**Content warning:** the source code contains Azaroth-branded default settings and sample product content. Before allowing the new site to read this CMS, replace/review the default branding, products, links, and copy in the CMS and publish the approved content. Keep the new site disconnected until this is checked.

## Included

- Admin UI and route shell under `src/pages/admin`, `src/components/admin`, `src/context`, and shared utilities/types.
- Express API and server entry point (`server.ts`, `api/index.ts`).
- Authentication, authorization, validators, HTML/SVG sanitization, database and migration code, email, and media-storage adapters.
- Required frontend source, styles, and source images so the supplied project can build in isolation.
- Package manifests, TypeScript/Vite/Playwright/Docker/Vercel configuration, tests, and deployment notes.
- `.env.example` with blank values only.

## Intentionally excluded

- `.env` and any real secrets/credentials.
- `.git` history and local agent configuration.
- `node_modules` and generated `dist` output; install dependencies and build in the target environment.
- `data/db.json` and other runtime data. This prevents transferring the source site's users, content, settings, enquiries, or password hashes into the new site.
- Existing `uploads/` media files. A clean upload directory is provided so the app can initialize without importing old site media. Upload or configure the media that belongs to the new site separately.

## Quick start (isolated local run)

Requirements: a Node.js version compatible with the dependencies in `package.json`, and npm.

1. Extract this ZIP into its own folder, separate from the new site's repository.
2. Copy `.env.example` to `.env`.
3. Set at least:
   - `JWT_SECRET` to a long, random, unique secret.
   - `INITIAL_ADMIN_EMAIL` to the intended first administrator email.
   - `INITIAL_ADMIN_PASSWORD` to a unique strong password (minimum 8 characters; prefer a much longer password).
   - `PORT` to an unused port, e.g. `4300`.
4. For production, configure a dedicated PostgreSQL database using `DATABASE_URL` and the required SSL settings for your provider. Do not reuse the new site's database unless you have explicitly reviewed schema and ownership requirements. Local JSON-file storage is intended for local/dev use, not multi-instance production.
5. Run:

   ```bash
   npm ci
   npm run lint
   npm run build
   npm start
   ```

6. Open `http://localhost:4300/admin/login` (or the configured port).
7. Check `http://localhost:4300/api/health` before connecting a public site.

The first administrator is provisioned according to the included server/database logic. Do not use development credentials in production. Keep `.env` out of source control.

## Connecting a different public website

The CMS does **not** automatically control another site's pages just because this ZIP is deployed. The new website must consume the CMS content API, or its server/reverse proxy must route the relevant requests to this CMS service.

### Option A — recommended for a separate frontend

Keep the CMS on its own origin. In the new site's server-side content adapter, request the CMS API using a configured server environment variable such as `CMS_API_BASE_URL=https://cms.example.com`. The adapter should fetch only published/public content for public pages. Never expose the CMS admin token, database credentials, or private API endpoints to the browser.

### Option B — same-origin reverse proxy

If the new site already expects same-origin API calls, configure its reverse proxy to forward a dedicated prefix such as `/cms-api/` to the CMS API, stripping the `/cms-api` prefix before forwarding to the CMS service. Also route the CMS media prefix (for example `/cms-media/`) to the CMS media handler or use a public object-storage URL. Do not overwrite the new site's existing `/api/*` routes; use a dedicated prefix unless you have verified that the path is unused.

A reverse-proxy example must be adapted to your actual hosting platform, TLS, and route layout. Do not paste generic Nginx configuration into a non-Nginx host.

### API surfaces present in this source

- `GET /api/health` — health status.
- `POST /api/auth/login`, `GET /api/auth/me`, profile/password endpoints — CMS authentication (admin only where applicable).
- `GET /api/settings` — public/published site settings; draft and publish endpoints require editor/admin access.
- `GET /api/products` and `GET /api/products/:slug` — public product content; administrative product operations require appropriate authorization.
- `/api/pages` and `/api/pages/:slug` — CMS-managed pages; draft/publish operations are protected.
- `GET /api/media`, `POST /api/media/upload`, `PATCH /api/media/:id/name`, and `PATCH /api/media/:id/alt` — media library operations; protected for editors. Display-name changes preserve the stored object key and media URL.
- `GET /api/media/:id/download` — authenticated media download with an attachment filename; protected for editors.
- `/api/enquiries` and `/api/leads` — public submission endpoints and protected inbox/status endpoints.
- `/uploads/*` — media files in disk-storage mode; in object-storage mode use the configured public storage URL.

Confirm the exact response shapes in `server.ts` and the frontend API calls before implementing an adapter. Do not assume every endpoint is public: some endpoints change behavior based on authentication and role.

## Important integration boundaries

1. Keep the CMS database separate from the new site's database by default. The CMS currently has its own schema/migrations and can create its own tables.
2. Do not copy `data/db.json` from the old project. A fresh CMS data store is deliberate; import only content you have reviewed and approved.
3. Do not copy old `uploads/` files over the new site's media folder. Use a separate media prefix/bucket or a separate upload directory.
4. The CMS's built-in preview currently assumes its own app origin and current public page renderer. Previewing pages on the new site's frontend requires a deliberate preview integration (for example a signed, short-lived preview token and a preview route in the new site). Do not expose drafts publicly as a shortcut.
5. Cross-origin browser requests are not configured as a general-purpose public CORS API in this source. Prefer server-side fetching or a same-origin reverse proxy; do not enable permissive `*` CORS for admin APIs.
6. Preserve the new site's `package.json`, router, CSS, build config, environment variables, and server entry point. Integrate through a small adapter or reverse proxy, not by replacing these files.
7. If you need the CMS embedded inside the new site's existing admin dashboard instead of a separate CMS host, treat that as a separate integration project: mount/rewrite routes, resolve CSS conflicts, share or bridge authentication deliberately, and verify role enforcement. Do not merge source trees blindly.

## Deployment notes

- See `DEPLOYMENT.md` for the source project's deployment requirements and supported storage modes.
- Vercel/serverless filesystems are ephemeral; use the documented S3-compatible media storage mode and PostgreSQL for production persistence.
- For Docker/VPS, mount persistent storage only for this CMS service and keep it separate from the new site's uploads/data directories.
- Configure a unique JWT secret, secure database credentials, SMTP credentials only if email notifications are needed, and a production-grade media-storage option.
- Do not expose `/api/users`, draft endpoints, revision endpoints, enquiries, leads, or admin media operations without their intended authentication/authorization.

## Validation before go-live

Run `npm ci`, `npm run lint`, `npm run test:unit`, `npm run test:integration`, and `npm run build`. Run `npm run test:e2e` if a compatible browser is installed. Then test login, role restrictions, settings save/publish, product/page save/publish, media upload, and persistence against the actual target environment. A local build alone does not prove the new website is integrated.
