# Azaroth Tech-Hive implementation status

Status is based on checks actually run in this workspace. `PASS` means verified by the stated check; a screen alone does not count as verification.

## Existing module inventory

| Module | Source present | Current status |
| --- | --- | --- |
| Admin dashboard and diagnostics | Yes | Partial; admin diagnostics now uses protected detailed health, live production DB probe exists; production DB unavailable here |
| Authentication and session/token handling | Yes | Partial; JWT auth exists; role set remains admin/editor/viewer |
| User profile and management | Yes | Source present; integration not run |
| Role/permission management | Yes | Partial; server guards exist, `super_admin` is not implemented |
| Pages and section builder | Yes | Partial; durable PostgreSQL draft table and atomic publish path added; live DB/restart scenario blocked |
| Product management | Yes | Partial; public catalog can be enabled/disabled; other product writes and publish lifecycle need durable versioning |
| Branding, theme, typography, animation | Yes | Source present; new plum/gold/orchid/peach/ivory palette applied to source defaults and legacy hardcoded burgundy values |
| Header/navigation and footer | Yes | Source present; existing editing retained; integration suite not run |
| Media library and storage adapters | Yes | Local browser upload, display-name change, authenticated download, delete, and signed S3 GET verified; live S3/CDN round trip remains unverified |
| Chatbot and FAQ manager | Yes | Partial; public chatbot is now controlled by the persisted approved add-on switch |
| Animation Studio | Yes | Partial; requested animation preset list and separate Glossy Effects controls added; browser and DB-backed rendering not yet verified |
| Leads/enquiries inbox and email | Yes | Source present; delivery and persistence not verified |
| CMS settings hub and deployment guide | Yes | Source present; detailed health endpoint is admin-only |
| Revision history and restore | Partial | Existing endpoint/state found; durable comprehensive revision rollback is not established |
| Services, industries, team, testimonials, analytics modules | No separate admin modules confirmed | No new functionality invented; existing page sections remain in the page builder where supported |

## Changes in this pass

- Fixed the rotating page content bug: a `targetScope: 'global'` animation ("Disc Drift") was being folded into every section's `activePreset`, applying a continuous rotation class to all page content. Global animations are now rendered once at the page level in a new `GlobalAnimationLayer` mounted inside `PublicPage`.
- Cloudflare R2 media storage is now production-correct. R2 is not plain S3: it only accepts region `auto` and only supports path-style URLs. The storage config now auto-detects R2 endpoints (`S3_R2=true` or `*.r2.cloudflarestorage.com`), defaults the region to `auto`, and forces path-style URLs for both signing and public URL generation. Without this, uploads fail with a 403 signature-mismatch in production while the identical local disk path keeps working.
- Added `S3_R2` env var, documented the R2 configuration in `DEPLOYMENT.md`, and added a startup probe that logs a warning if an R2 endpoint is detected with the wrong region or URL style.
- Added media-storage unit tests covering R2 auto-region, explicit-region override, and non-R2 defaults.
- Added authenticated Media Library download and display-name update operations. Name edits preserve the stored object key and URL; Postgres sync updates the display name. Added browser coverage for upload, rename, download bytes, deletion, public brand-name publishing, and Leads CSV download.
- Fixed the isolated Playwright server environment and established Windows visual baselines so the E2E suite runs without a production database.

## Verification record

| Check | Result | Evidence/limitation |
| --- | --- | --- |
| `npm run lint` | PASS | TypeScript `tsc --noEmit` completed with exit code 0 after latest source changes |
| `npm run test:unit` | PASS | 25 passed, 0 failed |
| Media storage tests | PASS | 5 passed, 0 failed (R2 region auto-default, explicit override, non-R2 defaults, signed PUT/GET/DELETE round-trip) |
| `npm run build` | PASS | Vite production build succeeded; main JS bundle exceeds 500 kB advisory threshold |
| `npm test` integration phase | BLOCKED | Unit phase passed, integration runner requires `TEST_DATABASE_URL`, which is not configured |
| Live PostgreSQL migrations and page draft restart scenario | BLOCKED | No test database is configured |
| Playwright/E2E | PASS | Full Chromium suite and CMS media/branding/CSV download browser flows verified locally; production database and object-storage round trips remain unverified |
| Object storage/CDN, email delivery, backups/restores | NOT RUN | Requires deployment services and credentials |
| Accessibility/WCAG manual acceptance | NOT RUN | Requires browser and assistive-technology review |

## Remaining release blockers

- Integration tests must run against an isolated PostgreSQL database; migration v4 (`ath_addons`) and the draft/publish transaction are not live-verified here.
- Add-on registry is trusted and preinstalled, but it does not yet provide add-on-specific visual settings forms, package upgrades, migration rollback, failure isolation, or audit events. Current built-in schemas are empty.
- Glossy Effects and section rendering are implemented, but combined motion/gloss behavior, contrast on real content, mobile touch behavior, and public saved-state rendering have not been browser-tested.
- `super_admin` and tenant/site isolation are not implemented.
- Other content types still have inconsistent publishing/version behavior, and most database write helpers remain outside this awaited-write refactor.
- Durable revision snapshots and restore are not established across content types.
- Media byte-signature validation, persistent storage round trips, email delivery, production deployment, backup restoration, and concurrency/multi-instance tests remain unverified.
- The application remains React/Vite + Express + `pg`; Next.js, Prisma, SSR and a general third-party adapter are not implemented.

**Readiness: not ready for production sign-off.** This is a staging candidate requiring database-backed acceptance and resolution of the remaining blockers above.
