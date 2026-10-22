# Production Stabilization Verification

**Validation date:** 2026-10-22
**Status:** Local fixes verified; production sign-off is not granted.

## Findings and changes

| Priority | Root cause / result |
|---|---|
| Deployment compatibility | The Vercel function imported the database module from the wrong relative path, causing TypeScript failure and preventing the API function from loading. Fixed the import. The production build also omitted source images and existing uploads from `dist`; the build now copies them and Vercel routes preserve their current URLs. Live Vercel behavior remains unverified. |
| Public routing | `/` was already the public homepage and admin routes were protected. The catch-all redirected unknown nested paths to `/` instead of showing the existing public 404. It now uses the public dynamic-page 404. |
| White-label branding | The admin login and initial HTML metadata hardcoded Azaroth despite the existing saved header branding. The login heading, browser title, and favicon now use configured branding, with the existing default as fallback. A separate Company A branding setup was not available for testing. |
| Automatic admin login | No automatic authenticated session was found: the frontend requires a stored token verified by `/api/auth/me`. The unused hard-coded default-user object was removed. Docker Compose contained fixed JWT and administrator credentials; it now requires environment values. |
| Admin profile | The login response and `/api/auth/me` return the database user, and the admin layout already renders name, email, and role. The reported profile failure was not reproduced separately from the login API failure. Backend identity/session tests pass; a successful browser login and profile display were not verified. |
| CMS media operations | The Media Library had upload, alt text, copy URL, and delete but lacked download and display-name editing. Added authenticated download and display-name update APIs/UI; renaming preserves the object key and URL. |
| Default site-wide orb | A saved global `orbit-spin` animation rendered a decorative sphere over every public route. Global orbital animations are no longer rendered as page overlays; orbital visuals inside page content remain supported. |
| Isolated browser testing | The E2E server declared production mode while clearing its database URL, causing startup to abort. It now uses the isolated test environment. Added and verified upload/rename/download/delete, branding publish, and leads CSV browser coverage. |

## Verification

- **TypeScript:** PASS — `npm run lint`.
- **Production build:** PASS — `npm run build`. Vite reports the existing large-JavaScript-chunk warning.
- **Unit tests:** PASS — `npm run test:unit`, 25/25.
- **Media storage tests:** PASS — 5/5, including signed S3-compatible GET.
- **Integration tests:** BLOCKED — `npm test` requires an isolated `TEST_DATABASE_URL`, which is not configured in this workspace. Do not substitute production credentials.
- **Browser E2E:** PASS — 18/18 Chromium tests, including upload, display-name change, authenticated download with byte verification, deletion, brand-name publish, and CSV export. The E2E server uses isolated test data and Vite test middleware; it does not prove deployed runtime behavior.
- **Branding and exports:** PASS — the browser test changed and published the site brand name; Leads Inbox CSV download produced a file containing the seeded lead.

## Deployment status and unresolved work

- **Vercel testing deployment — BLOCKED.** No Vercel CLI, project link, or local authentication is available in this workspace. A preview deployment, production database connection, and live API/media check remain unverified.
- **Cloudflare production — BLOCKED.** The selected plan is to use Cloudflare as DNS/CDN proxy and R2 while keeping the Express app on a Node-capable host. No Cloudflare project/CLI linkage is available here; Pages/Workers cannot run this Express app as-is.
- **Database persistence, uploads after redeploy, and production profile/branding flows:** UNVERIFIED outside the local integration test environment.

Do not use the earlier “conditionally ready for production” assessment as a current approval. Production readiness remains blocked on deployment-specific storage/runtime integration and live verification for both targets.

## Follow-up local hardening

- Added an S3-compatible media adapter (`MEDIA_STORAGE=s3`) with disk storage as the default. Uploads, deletes, SVG sanitization, public URLs, and object-key prefixing are covered by local tests; a real bucket/CDN round-trip is still unverified.
- Replaced the inline schema block with versioned, transactional migrations in `src/server/migrations.ts`. Version 2 adds the media upload index.
- Added Playwright visual baselines for the desktop overlay navbar and mobile drawer, alongside the existing functional RTL/footer/navbar tests.
- Centralized admin media uploads in `src/utils/mediaUpload.ts` and removed duplicated fetch/FormData logic from the admin managers.
- Latest local verification: lint pass, 25/25 unit tests, 5/5 media storage tests, production build pass, and 18/18 Chromium E2E tests. Integration tests and both provider deployments remain unverified.
