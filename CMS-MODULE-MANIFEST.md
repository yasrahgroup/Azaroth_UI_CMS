# CMS module manifest

This is an isolated extraction from the supplied `Azaroth_UI_CMS(Sign Off).zip` project.

## Runtime stack identified from source
- React + TypeScript + Vite frontend
- Express + TypeScript backend
- PostgreSQL when `DATABASE_URL` is configured; local JSON file fallback in development
- JWT-based CMS authentication and role checks
- Local disk or S3-compatible media storage

## Included source groups
- `src/pages/admin/` — admin/CMS screens
- `src/components/admin/` — CMS layout, media picker, settings actions
- `src/context/` — authentication and theme/settings contexts
- `src/server/` — database, migrations, authentication helpers, validators, sanitization, email, media storage
- `src/utils/` and `src/types/` — shared CMS helpers and types
- `server.ts` and `api/index.ts` — server/API entry points
- `tests/`, `test/`, `e2e/` — source tests
- `package.json`, `package-lock.json`, Vite/TypeScript/Playwright/Docker/Vercel configuration

## Deliberate exclusions
- `.env` — secret values must not be redistributed
- `.git/` — repository history and metadata
- `node_modules/`, `dist/` — generated/dependency files
- `data/db.json` — runtime data, user records, password hashes, settings, enquiries, content
- Existing `uploads/` files — site-specific media; empty folder retained

## Important limitation
The source app is currently a standalone CMS-enabled website rather than a framework-neutral CMS plugin. The admin frontend and API are ready to run as a separate service, but a new site's frontend must be explicitly wired to the CMS API (or a dedicated reverse proxy) to display CMS-managed content. See `CMS-INTEGRATION-GUIDE.md`.

The current source includes Azaroth-branded defaults/sample products. Review and replace them before connecting this instance to a different public site.
