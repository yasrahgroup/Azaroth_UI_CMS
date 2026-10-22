# AZAROTH TECH-HIVE — INTEGRATED RELEASE CANDIDATE

**Release:** RC-2 / October 22, 2026  
**Production sign-off:** **NOT GRANTED** — staging and production acceptance steps remain open.

## What is delivered

This package is based on the larger supplied `Azaroth_CMS_Standalone_Integration_Module.zip`, which contains a React/Vite website, Express API, PostgreSQL support, authentication, CMS screens, source assets, and tests. The smaller `azaroth-cms-fullstack.zip` was reviewed but **not combined into the application runtime**: it is a partial Next.js scaffold referencing missing imports, not a deployable replacement or compatible drop-in component.

### Integrated modifications

- Deep Plum `#46213F` as primary color.
- Warm Gold `#C49A50` as secondary color.
- Orchid `#B56BCB` and Peach `#F2B6A0` as gradient endpoints.
- Warm Ivory `#FBF7EF` as public background.
- Glassmorphism/reflective gold CSS helpers for design components.
- Matching CMS theme defaults for **new, uninitialized installations**.
- A CMS **Plum & Gold Luxury** preset in Theme & Colors, editable using the existing draft/publish flow.
- Prior site pages, backend, routes, role protections, and CMS screens retained.

## Important limitations

1. **Not production-certified:** The supplied source's own production validation report already states sign-off was withheld, pending live Vercel/Cloudflare, database, and persistent-media verification.
2. **Existing installations:** Saved PostgreSQL/JSON settings override code defaults. To activate the new look on a previously used deployment, open the CMS **Theme & Colors**, select **Plum & Gold Luxury**, then save and publish. This avoids silently overwriting administrator changes.
3. **Glass effects:** The CSS classes (`az-glass`, `az-card-3d`, `az-btn-gold`, `az-gradient-text`) are included for supported public components. They are not automatically applied to every existing section or individually editable with CMS controls.
4. **Full CMS configurability:** The standalone implementation provides significant CMS functionality but was not verified to meet every provision of the supplied 100%-CMS-driven Next.js/Neon architecture specification. That specification is aspirational relative to the provided code.
5. **Dependency/test execution:** Dependencies were not available in the working container and `npm ci` did not finish. This release has **not** passed a fresh compile, complete test run, or browser acceptance tests after integration.
6. **Security:** Do not deploy using empty/sample secrets, public sample contact details, or default administrators. Check account credentials, CORS, upload limits, email setup, backups, and role permissions in the deployment environment.

## How to launch on a trusted development machine

```bash
npm ci
cp .env.example .env
# Fill in valid DATABASE_URL, JWT_SECRET and INITIAL_ADMIN_EMAIL/PASSWORD
npm run lint
npm test
npm run build
npm run dev
```

For container, Vercel, media storage, and server instructions see `DEPLOYMENT.md` and `CMS-INTEGRATION-GUIDE.md`.

## Sign-off checklist (all required before production)

- [ ] Clean `npm ci`, TypeScript check and production build pass.
- [ ] Unit, integration and browser E2E tests pass.
- [ ] Fresh database migration and seeded admin verified without default credentials.
- [ ] CMS login, draft editing, publish, preview, reversion, and role checks verified.
- [ ] Page builder, products, global navigation, favicon, branding, SEO and responsive views inspected.
- [ ] New Luxury preset selected and published on **existing** databases.
- [ ] Real PostgreSQL/Neon persistence and backup/restore verified.
- [ ] Persistent media upload/load/delete verified after deployment/redeployment.
- [ ] Contact form and emails verified with actual environment credentials.
- [ ] Vercel or other selected runtime API and SPA fallback routes verified live.
- [ ] Accessibility, broken links, mobile layout, browser compatibility, and security review performed.
- [ ] Product owner signs off a staging URL before production release.

## Source audit snapshot

| Input | Result |
| --- | --- |
| `Azaroth_CMS_Standalone_Integration_Module.zip` | Primary working application base; source with backend/frontend/test infrastructure |
| `azaroth-cms-fullstack.zip` | Next.js skeleton; cannot be safely merged mechanically with Vite/Express |
| `Pasted text.txt` | Requirement reference for dynamic pages, global CMS settings, renderer, publishing, and validation |
| `azaroth-luxury-theme.css` | Added to `src/` and imported by `src/main.tsx` |

**Release decision:** Development / staging candidate only. No assertion of live production readiness is made.


See **RC2-FIXES-AND-VERIFICATION.md** for updated fixes and current verification.
