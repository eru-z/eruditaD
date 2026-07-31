# Erudita Zilbeari — Portfolio

React/Vite portfolio with a Node backend for the admin CMS, contact messages,
analytics, uploads, and AI assistant.

## Local development

```bash
npm install
npm run dev:full
```

The local backend stores content in `.portfolio-data/` and media in `uploads/`.
Those runtime folders are intentionally ignored by Git.

## Production

```bash
npm run build
npm start
```

Deploy this as a Node web service, not as a static Vite site. `npm start` serves
both the frontend and `/api/*` routes.

### Durable admin content and uploads (recommended)

For hosts whose filesystem is erased on deploy or restart, create a Supabase
project and:

1. Run `scripts/supabase-setup.sql` in the Supabase SQL editor.
2. Set these server-only environment variables on the host:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_BUCKET=portfolio-media
ADMIN_USERNAME=your-admin-user
ADMIN_PASSWORD=a-long-unique-password
CORS_ORIGIN=https://your-domain.example
```

Never prefix the service-role key with `VITE_` and never commit it. With these
variables configured, portfolio edits are stored in the `portfolio_state`
table and uploaded project media is stored in the public `portfolio-media`
bucket. They survive Git pulls and application redeploys.

Production requires Supabase by default (`REQUIRE_DATABASE=true`) and refuses
to start if the database credentials are missing or inaccessible. This keeps
admin saves from silently going to a host's disposable filesystem. Local
development continues to use `PORTFOLIO_DATA_DIR` and `uploads/`.

Set `NODE_ENV=production` on the host. Production startup rejects default admin credentials and wildcard CORS. Other optional variables are documented in `.env.example`.

GitHub only stores the source code; pushing a commit does not deploy database
content. GitHub Pages cannot run this admin API, so deploy the project to a host
that runs the Node server (for example Render, Railway, or Fly.io).

## Health check

```bash
curl https://your-domain.example/api/health
```

The response reports `persistence: "supabase"` and `durable: true` when durable
remote storage is configured.

## Recovered project content

`data/portfolio.json` is the committed production seed. It now contains the
recoverable admin projects plus the richer case-study entries already present
in the repository. Runtime admin changes remain separate from this seed.

### Admin security requirements

- Use a password-manager-generated admin password of at least 20 characters; never reuse it anywhere else.
- Keep `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, SMTP credentials, and API keys only in the hosting provider's encrypted environment variables. Never add them to GitHub or any `VITE_*` variable.
- Set `CORS_ORIGIN` to the exact HTTPS production origin, with no wildcard.
- Admin sessions expire after inactivity (30 minutes by default). Five failed logins from one address trigger a 15-minute lockout.
- The API uses timing-safe credential comparison, strict bearer-token parsing, no-store auth responses, and browser security headers.
- Protect the hosting-provider and Supabase accounts with MFA. Restrict repository and deployment access to the owner.
- Rotate the admin password and Supabase service-role key immediately if either might have been exposed.

### Data durability and deployment safety

Admin content is runtime database data, not Git source. A GitHub push cannot overwrite the Supabase `portfolio_state` row. Production refuses to start without durable Supabase configuration when `REQUIRE_DATABASE=true`. Before the first production deployment, run `scripts/supabase-setup.sql`; then verify `/api/health` reports `"persistence":"supabase"` and `"durable":true`.

The first production start seeds an empty Supabase state from the committed portfolio seed. After that, all admin edits are read from and written to Supabase and survive redeploys, restarts, Git pushes, and fresh server instances. Keep periodic Supabase backups or point-in-time recovery enabled for disaster recovery.

### OpenRouter assistant setup

The assistant calls OpenRouter only from the Node backend. Add these values to your local `.env` and to your hosting provider's server/runtime environment (never to Vite or `src`):

```env
AI_API_KEY=your_openrouter_key
AI_MODEL=openrouter/free
PORTFOLIO_URL=https://your-deployed-portfolio.example
AI_TIMEOUT_MS=30000
```

Create the key in your OpenRouter account, restart the backend after changing environment variables, and confirm `/api/health` reports `assistant.provider: "openrouter"` and `assistant.configured: true`. The browser must call only `/api/chat` or `/api/chat/stream`; it must never call OpenRouter directly.

## Vercel deployment

This repository now includes a Vercel catch-all Node Function, SPA routing, persistent Supabase rate limits, stateless admin sessions, and direct signed Supabase uploads. Follow `VERCEL_DEPLOYMENT.md` exactly before the first deployment.

```bash
npm run migrate:supabase
npm run build
```

The migration is required once to move current ignored local admin state and uploads into durable Supabase storage.
