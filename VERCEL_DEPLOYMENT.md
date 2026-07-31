# Vercel Deployment Guide — erudita.dev

The repository is configured as a Vite SPA plus a catch-all Vercel Node.js Function. No code changes are required during deployment. The external services must be configured before the first production deployment.

## Architecture

```text
Browser
  ├─ static Vite application from dist/
  ├─ same-origin /api/* requests
  │    └─ api/[...path].js (Vercel Function)
  │         ├─ signed, stateless admin authentication
  │         ├─ Supabase PostgreSQL persistence
  │         ├─ Supabase atomic rate limits
  │         ├─ OpenRouter streaming
  │         └─ SMTP contact delivery
  └─ signed direct uploads → Supabase Storage
```

The browser never receives `AI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, SMTP credentials, the admin password, or the session signing secret. Large files do not pass through Vercel Functions.

## Repository structure

```text
portfolio/
├─ api/
│  └─ [...path].js                 # Vercel catch-all API Function
├─ data/                            # safe committed seed/knowledge files
├─ public/                          # static public assets
├─ scripts/
│  ├─ dev-full.mjs                 # local frontend + backend runner
│  ├─ migrate-to-supabase.mjs      # one-time durable data/media migration
│  └─ supabase-setup.sql           # tables, validation trigger, bucket, rate-limit RPC
├─ server/
│  ├─ index.js                     # shared standalone/serverless API implementation
│  └─ openrouter.js                # backend-only OpenRouter provider
├─ src/
│  ├─ admin/                       # admin CRUD managers
│  ├─ components/                  # public/admin UI and assistant
│  ├─ data/                        # frontend defaults/assistant knowledge
│  ├─ pages/                       # portfolio, projects and admin routes
│  ├─ services/                    # assistant streaming client
│  ├─ styles/                      # responsive/admin shared styles
│  └─ utils/                       # API, storage, assets, filters and validation
├─ tests/
│  ├─ browser.audit.mjs
│  ├─ chatbot.e2e.test.mjs
│  ├─ openrouter.test.mjs
│  ├─ projects.e2e.test.mjs
│  ├─ serverless.e2e.test.mjs
│  └─ vercel-handler.test.mjs
├─ .env.example
├─ eslint.config.js
├─ package.json
├─ vercel.json                     # Vercel build, Function, SPA, cache and headers
├─ vite.config.js
├─ PRODUCTION_CHECKLIST.md
└─ VERCEL_DEPLOYMENT.md
```

`node_modules/`, `dist/`, `.env`, `.portfolio-data/`, and local `uploads/` are intentionally not committed. Runtime content is migrated to Supabase.

## Files changed for the Vercel conversion

- `api/[...path].js` — new Vercel Function entry point.
- `vercel.json` — new Vercel build, routing, Function, cache and security configuration.
- `server/index.js` — reusable Function handler, stateless authentication, durable rate limiting, signed uploads, production validation and safe logging.
- `src/utils/storage.js` — direct signed Supabase uploads with timeout/error handling and local-development fallback.
- `scripts/supabase-setup.sql` — durable rate-limit table/RPC in addition to portfolio state and Storage setup.
- `scripts/migrate-to-supabase.mjs` — one-time local state/media migration.
- `tests/serverless.e2e.test.mjs` — cross-instance token verification.
- `tests/vercel-handler.test.mjs` — direct Vercel Function handler verification.
- `package.json` and `package-lock.json` — Supabase client, migration script and serverless tests.
- `.env.example` — Vercel-safe required environment template.
- `README.md`, `PRODUCTION_CHECKLIST.md`, and `VERCEL_DEPLOYMENT.md` — operating and deployment documentation.

The previously completed production audit also changed the responsive UI, admin managers, chatbot, portfolio data and shared styles; those changes remain listed in `PRODUCTION_CHECKLIST.md`.

## 1. Prepare Supabase

1. Open the Supabase project.
2. Open **SQL Editor** → **New query**.
3. Paste the complete contents of `scripts/supabase-setup.sql`.
4. Click **Run**.
5. In **Table Editor**, confirm:
   - `portfolio_state` exists.
   - `portfolio_rate_limits` exists.
6. In **Storage**, confirm the public `portfolio-media` bucket exists.
7. In **Project Settings → API**, copy:
   - Project URL.
   - The backend-only `service_role` key or current Supabase secret key. Do not use an anon or publishable key.

The current local configuration was detected with a publishable-looking value in `SUPABASE_SERVICE_ROLE_KEY`. Replace it with the true backend secret before migration. No secret was printed or committed.

## 2. Migrate current admin data and uploads

After replacing `SUPABASE_SERVICE_ROLE_KEY` in the ignored local `.env`, run:

```powershell
npm run migrate:supabase
```

This command:

- selects `.portfolio-data/portfolio.json` when available;
- migrates referenced local images, PDFs and videos to Supabase Storage;
- rewrites `/uploads/...` references to permanent Supabase CDN URLs;
- uploads portfolio state, messages and analytics to PostgreSQL;
- leaves source files and local secrets untouched.

Review the final migration count. Missing local files are reported explicitly and skipped; replace those entries from the admin panel after deployment if any are reported. Running the migration again is safe because it uses upserts.

## 3. Required Vercel environment variables

Add these under **Vercel Project → Settings → Environment Variables**. Select **Production** for every value. Add them to Preview only if preview deployments must access the real production database.

```env
ADMIN_USERNAME=your-private-admin-username
ADMIN_PASSWORD=your-password-manager-generated-password-of-20-plus-characters
ADMIN_SESSION_SECRET=a-separate-random-secret-of-at-least-32-characters
ADMIN_SESSION_TTL_MINUTES=30

CORS_ORIGIN=https://erudita.dev
PORTFOLIO_URL=https://erudita.dev

REQUIRE_DATABASE=true
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_BACKEND_ONLY_SERVICE_ROLE_OR_SECRET_KEY
SUPABASE_BUCKET=portfolio-media

AI_API_KEY=YOUR_OPENROUTER_KEY
AI_MODEL=openrouter/free
AI_TIMEOUT_MS=30000
MAX_MESSAGES_PER_VISITOR_PER_DAY=25
MAX_OUTPUT_TOKENS=450
MONTHLY_BUDGET_USD=5
CHATBOT_DEV_MOCK_RESPONSES=false

CONTACT_EMAIL_TO=your-destination-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-account@example.com
SMTP_PASS=your-provider-app-password
SMTP_FROM=your-verified-sender@example.com
```

Do not create Vite variables for any secret. In particular, never create `VITE_AI_API_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, or `VITE_ADMIN_PASSWORD`. Vercel supplies `NODE_ENV=production` and its own runtime variables automatically; do not add `PORT`.

Generate `ADMIN_SESSION_SECRET` locally without printing it into source control:

```powershell
$bytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

Store the output in the Vercel encrypted environment and your password manager. The ignored local `.env` already has a newly generated secret, so that same value may be copied privately into Vercel.

## 4. Push to GitHub

From the repository root:

```powershell
git status
git add .
git commit -m "Prepare portfolio for production Vercel deployment"
git push origin main
```

Before committing, confirm `.env`, `.portfolio-data/`, and `uploads/` do not appear in `git status`. They are ignored intentionally.

## 5. Import into Vercel

1. Sign in to Vercel using the GitHub account that owns the repository.
2. Click **Add New → Project**.
3. Import the portfolio repository.
4. Leave **Root Directory** as the repository root.
5. Vercel should detect **Vite**. `vercel.json` already defines:
   - install: `npm ci`;
   - build: `npm run build`;
   - output: `dist`;
   - API Function: `api/[...path].js`;
   - Function duration: 60 seconds;
   - SPA deep-link fallback;
   - immutable hashed-asset caching;
   - production security headers.
6. Add every Production environment variable from section 3 before deploying.
7. Click **Deploy**.

## 6. Verify the first Vercel deployment

Open the assigned `*.vercel.app` deployment and check:

1. `/api/health` returns JSON with:
   - `ok: true`;
   - `persistence: "supabase"`;
   - `durable: true`;
   - assistant configured and streaming.
2. `/admin` accepts the configured credentials.
3. `/admin/dashboard` is inaccessible after logout.
4. Create a temporary project, edit it, refresh, and delete it.
5. Upload an image and a video; their returned URLs must use `supabase.co/storage/`.
6. Feature exactly three projects and confirm the homepage updates.
7. Send a chatbot message that requires the live model.
8. Submit the contact form and confirm the email arrives.
9. Redeploy the same Git commit, then confirm admin edits and uploads remain.

If `/api/health` fails, inspect **Vercel Project → Logs → Functions**. Production errors include a `requestId` without returning internal credentials or database details to the browser.

## 7. Attach erudita.dev

In **Vercel Project → Settings → Domains**:

1. Add `erudita.dev`.
2. Add `www.erudita.dev`.
3. Set `erudita.dev` as the primary domain and redirect `www.erudita.dev` to it, matching `CORS_ORIGIN` and `PORTFOLIO_URL`.
4. At the current DNS provider, use the exact values Vercel displays. General-purpose values are:

```text
Type   Name   Value
A      @      76.76.21.21
CNAME  www    cname.vercel-dns-0.com
```

Vercel may show a project-specific CNAME; that displayed value takes precedence. Remove conflicting apex A/AAAA records and conflicting `www` records, but preserve MX/TXT records used by email. Alternatively, change authoritative nameservers to:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Nameserver changes require recreating existing email/DNS records in Vercel and can take 24–48 hours. Ordinary A/CNAME changes are usually faster. Vercel provisions and renews HTTPS automatically after DNS verifies.

## 8. Final production verification on erudita.dev

Run:

```powershell
Invoke-RestMethod https://erudita.dev/api/health
```

Then repeat the admin CRUD, upload, chatbot, contact and redeployment persistence checks on `https://erudita.dev`. Also verify `/projects/<project-id>` by opening it directly in a new browser tab to confirm SPA deep links.

## Local quality gates

```powershell
npm ci
npm run lint
npm test
npm run build
npm run test:browser
```

The current local result is: lint passes, 20 automated tests pass, live OpenRouter streaming passes, the production build passes, and the responsive Edge audit passes at all documented viewport sizes.

## Manual actions that cannot be encoded in source

These are account/ownership actions, not missing code:

- run the Supabase SQL with project-owner permission;
- provide the real Supabase backend secret;
- run the one-time migration while the local ignored runtime files exist;
- add encrypted Vercel environment values;
- authorize Vercel to import the GitHub repository;
- change DNS records for `erudita.dev`;
- verify delivery with the real email provider.

No manual source-code edits are required.
