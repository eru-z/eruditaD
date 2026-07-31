# Production Checklist

Last audited: 2026-07-31

## Audit status

Code-level build, API, persistence-fallback, assistant, contact-path, and responsive browser checks pass. Production activation remains conditional on the external Supabase, SMTP, DNS/TLS, analytics-provider, and hosting steps below. Do not describe the deployment as 100% production-ready until those external checks pass on the deployed URL.

## Automated checks completed

- `npm run lint`: passes with zero errors and zero warnings.
- `npm test`: 17/17 tests pass.
  - 9 OpenRouter provider tests: valid request, streaming, missing/invalid key, insufficient credit, free-model rate limit, unavailable model, timeout, stream error.
  - 5 authenticated API tests: project CRUD/order/publish/three-feature limit, achievement/certificate CRUD, skills CRUD/upload/order/validation, contact inbox, analytics.
  - 3 chatbot integration tests: safe health metadata, local fallback, live OpenRouter streaming through the backend.
- `npm run build`: Vite 8 production build passes.
- `npm run test:browser`: Microsoft Edge production-server audit passes for `/`, `/projects`, `/projects/:id`, `/admin`, protected admin redirect, internal-link checks, chatbot open/close, and persisted theme switching.
- Backend syntax and health startup were checked; production refuses unsafe/missing durable configuration.

## Responsive sizes verified

Headless Edge verified without horizontal document overflow, broken images, missing main landmarks, or runtime page errors at:

- 320x568
- 375x667
- 390x844
- 430x932
- 768x1024 (tablet portrait)
- 1024x768 (tablet landscape)
- 1280x800
- 1440x900
- 1920x1080
- 1024x600 (short-height)
- 844x390 (mobile landscape)

Shared safety CSS also covers safe-area insets, responsive media, 44px form/control heights, strong focus indicators, short-height chatbot scrolling, and reduced-motion preferences.

## Issues fixed

- Removed production fallback to localhost; browser API calls now stay same-origin in production.
- Kept OpenRouter credentials and calls server-only; the frontend calls only local `/api/chat` routes.
- Preserved assistant streaming, caching, multilingual/local fallback, timeout, rate limits, budget limits, and prompt-injection controls.
- Added useful page-level Suspense loading states.
- Added security headers and CSP to API, stream, static asset, and SPA responses.
- Hardened static path resolution against traversal and added immutable caching for hashed assets.
- Production now requires exact HTTPS CORS, a strong explicit admin password, durable Supabase, service-role credentials, and SMTP delivery credentials.
- Production rejects Supabase anon/publishable keys used as service-role keys.
- Backend exits non-zero on port conflicts so deployment health systems see startup failure.
- Removed a corrupted abandoned assistant implementation while retaining active helpers.
- Normalized invalid Windows-1252 source files to UTF-8.
- Upgraded Vite, the React plugin, Nodemailer, and test/lint tooling; fixed Vite 8 chunk configuration.
- Fixed four broken fallback/content image references.
- Added accessible chatbot dialog semantics and explicit button types.
- Added global overflow/media guards, focus visibility, reduced motion, short-height handling, and mobile safe-area chatbot placement.
- Confirmed exactly three featured projects in the committed seed and API/database validation.
- Admin edits trigger live frontend data events and periodic refresh; production data is stored in Supabase rather than Git or an ephemeral filesystem.

## Functional states verified

- Admin login, failed login, bearer session status, logout, protected routes, and CRUD authorization.
- Project create/update/delete, publication state, ordering, filter assignment, and maximum three featured projects.
- Skills, achievements, certificates, experience, messages, settings, and shared portfolio-state persistence through the generic authenticated state API; dedicated tests cover the highest-risk collection validators.
- Contact validation, SMTP test delivery path, protected admin inbox, message updates, and analytics visit collection.
- Chatbot configured/unconfigured health, local fallback, live streaming, invalid key, rate limit, credit, unavailable model, and timeout behavior.
- Loading, empty, success, validation, disabled, and error UI already present in managers and public data sections; failed API requests are surfaced rather than silently swallowed.

## Security checks

- Secrets are read only from backend environment variables. Never create `VITE_AI_API_KEY`, put a service-role key in `src`, or call OpenRouter/Supabase service APIs from the browser.
- Admin cookies/tokens are no-store, sessions expire, comparisons are timing-safe, login attempts are rate-limited, request bodies/uploads are size-limited, filenames are sanitized, and remote writes validate data.
- Supabase RLS is enabled; the service-role key bypasses it only from the backend.
- CSP, frame denial, MIME sniffing protection, restricted referrers/permissions, and cross-origin opener isolation are returned by the Node server.
- `npm audit` currently reports two high advisories inherited from React Router. They concern React Router server/RSC features this client-only BrowserRouter application does not use, and npm reports no fixed stable version. Monitor and upgrade when an upstream fix is published. This is the reason the project is not labeled 100% clean.

## Files removed

- `bun.lock` (npm is the canonical package manager).
- Root `me.png`.
- Unused components: `ProjectMatchmaker.jsx`, `ProjectShowcase.jsx`, old `Projects.jsx`.
- Unused styles: `engineering-proof.css`, `home-featured-card-update.css`.
- Unreferenced images: `erudita-hero-female.png`, `image-removebg-preview (1).png`, `me-hero-key.png`, `me.png`, `signature.png`.

## Dependencies removed

- `express` and `cors` (the backend uses Node HTTP directly).

## Required production environment variables

```env
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=your-private-admin-name
ADMIN_PASSWORD=a-password-manager-generated-value-of-at-least-20-characters
ADMIN_SESSION_TTL_MINUTES=30
CORS_ORIGIN=https://your-domain.example
PORTFOLIO_URL=https://your-domain.example
REQUIRE_DATABASE=true
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_BUCKET=portfolio-media
AI_API_KEY=your-openrouter-key
AI_MODEL=openrouter/free
AI_TIMEOUT_MS=30000
MAX_MESSAGES_PER_VISITOR_PER_DAY=25
MAX_OUTPUT_TOKENS=450
MONTHLY_BUDGET_USD=5
CONTACT_EMAIL_TO=your-inbox@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-user
SMTP_PASS=your-app-password
SMTP_FROM=your-verified-sender@example.com
```

Do not commit `.env`. `.env.example` is the safe template.

## Exact Supabase setup

1. Create a Supabase project and enable MFA on its owner account.
2. Open SQL Editor, paste all of `scripts/supabase-setup.sql`, and run it once.
3. Confirm `public.portfolio_state` exists, RLS is enabled, trigger `portfolio_state_validate` exists, and bucket `portfolio-media` is public.
4. Copy Project URL and the **service_role** key into the hosting provider encrypted server environment. Never use the anon/publishable key and never prefix either variable with `VITE_`.
5. Deploy, then request `/api/health`; require `persistence: "supabase"` and `durable: true`.
6. Log in, make a harmless settings change, restart/redeploy, and confirm it persists.
7. Enable Supabase backups/PITR appropriate to the project.

## Deployment

```bash
npm ci
npm run check
npm start
```

Deploy as one Node web service. Build command: `npm ci && npm run build`. Start command: `npm start`. Route the public domain to the service; do not deploy this as GitHub Pages or a static-only Vite site.

## Remaining external/manual production actions

- Run the Supabase SQL and verify a real CRUD edit survives a production restart/redeploy. The current local Supabase project previously returned `PGRST205` because `public.portfolio_state` had not been created.
- Configure a verified SMTP sender/app password and submit the deployed contact form; confirm receipt and spam-folder behavior. Local tests intentionally use SMTP test mode and do not send real mail.
- Configure the final domain, HTTPS, exact CORS/Referer values, and hosting health check `/api/health`.
- Connect the intended analytics provider/consent policy if third-party analytics is required; local first-party visit collection is tested.
- Test the deployed site manually in desktop/mobile Safari. Safari is unavailable on this Windows workstation. Edge was automated; Chromium compatibility is covered by the shared engine, and CSS avoids known fragile constructs. Perform a Firefox smoke test on the final deployed URL as a release check.
- Check every external social, booking, portfolio-live, and email link after final URLs are entered; external destinations and accounts cannot be guaranteed locally.
- Enable MFA for GitHub, hosting, Supabase, OpenRouter, and email; restrict repository/deployment access and rotate any previously exposed credential.
- Monitor the React Router advisories and upgrade when npm publishes a fixed stable release.

## Local commands

```bash
npm ci
npm run dev:full
npm run lint
npm test
npm run build
npm run test:browser
npm run check
npm start
```

## Vercel serverless conversion

- Added `api/[...path].js` as the Vercel catch-all Function.
- Added `vercel.json` with Vite build/output settings, SPA deep links, 60-second API duration, immutable asset caching, HTTPS/security headers, and bundled seed data.
- Replaced process-memory admin sessions with HMAC-signed stateless tokens that work across cold starts and independent Function instances.
- Moved production assistant and login rate limits to an atomic Supabase PostgreSQL RPC.
- Changed production media uploads to authenticated short-lived Supabase signed-upload URLs; files upload directly to permanent Storage and bypass Vercel Function body limits.
- Added `npm run migrate:supabase` to move current ignored local state, messages, analytics, images, PDFs, and videos before deployment.
- Added serverless cold-instance authentication and Vercel handler tests.
- Exact instructions are in `VERCEL_DEPLOYMENT.md`.
