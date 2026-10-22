# Azaroth Integrated RC2 — fixes and verification

## Follow-up hardening (22 October 2026)

- Restricted unpublished page reads to admin/editor roles, including list and direct-slug API requests.
- Added a separate PostgreSQL `ath_page_drafts` table and migration. Draft saves no longer write to the published `ath_pages` record.
- Made page draft saves await persistence and return an error on database failure. Page publication now promotes the draft and removes its draft row in one PostgreSQL transaction.
- Production startup now requires a reachable PostgreSQL database; production no longer reports the local JSON fallback as connected.
- Reduced public `/api/health` to a minimal liveness/readiness response. Detailed telemetry is available through the admin-only `/api/admin/health` endpoint.
- Added viewer draft-access regression assertions and corrected legacy footer social-link normalization exposed by the unit suite.
- Added a trusted preinstalled add-on registry, admin manager, persisted activation, and public gating for the product catalog and chatbot.
- Applied the new plum, gold, orchid, peach, and ivory identity across defaults/source colors; prior saved default tokens normalize when loaded.
- Added the requested Animation Studio preset library and separate Glossy Effects editor with configurable presets, per-section assignment, custom overrides, responsive preview, and reduced-motion-aware rendering.

## Changes made

- Mounted every existing public route inside the `PublicPage` luxury-theme scope, covering home, products, contact and CMS dynamic pages. The administrator routes are deliberately excluded.
- Retained published CMS color variables, the luxury color preset and gold/glass CSS helpers.
- Added consistent focus-visible outlines and reduced-motion handling on public routes.
- No framework migration was attempted; the existing Vite/Express architecture remains in place.

## Verification status

- ZIP entries and referenced source files checked, no local JS dependency packages included.
- TypeScript (`npm run lint`) **passed** after the follow-up changes.
- Unit tests **passed**: 23/23.
- Integration tests **blocked**: `TEST_DATABASE_URL` is not configured. No live PostgreSQL migration, draft persistence, or transaction behavior was exercised.
- Production build **passed**; Vite reports the main JavaScript chunk exceeds 500 kB.
- Playwright E2E, persistent media, email and production deployment are **not verified**.
- This is a staging release candidate, **not** complete product sign-off. The original Next.js/Prisma spec still requires architectural migration.

## Remaining release blockers

- Draft records are durable in PostgreSQL, but local JSON fallback remains a development mode; production runtime database outage behavior needs live acceptance testing.
- Other write paths and content types still need awaited persistence, durable versioning, and consistent draft/publish/rollback workflows.
- The general add-on registry/lifecycle, multi-site isolation, target-site adapter, `super_admin` role, and Next.js/Prisma/SSR baseline are not implemented.
- Production database, object storage/CDN, email, backups/restoration, accessibility, and browser acceptance remain unverified.

## Install and verify

```bash
npm ci
cp .env.example .env
# Provide DATABASE_URL, JWT_SECRET and INITIAL_ADMIN_* in .env
npm run lint
npm test
npm run build
npm run test:e2e
```

Use `CMS-INTEGRATION-GUIDE.md`, `DEPLOYMENT.md` and `REQUIREMENTS-GAP-MATRIX.md` for remaining steps and acceptance requirements.
