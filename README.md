# Erudita Zilbeari — Portfolio

Premium personal portfolio + admin panel.

## Stack
React + Vite, React Router DOM, Tailwind CSS, Framer Motion, Lucide React. No backend — content stored in localStorage.

## Run
```bash
npm install
npm run dev
```

## Admin
Go to `/admin` and login:
- Email: `admin@erudita.pro`
- Password: `admin123`
# Current Production Notes

This portfolio is not static-only. It has a React/Vite frontend plus a Node
backend for `/api/*`, admin, contact messages, analytics, uploads, and the AI
assistant.

## Local Development

```bash
npm install
npm run dev:full
```

## Production

```bash
npm run build
npm start
```

`npm start` serves both the built frontend and the backend API. Use this mode
for production if the AI assistant, admin panel, contact form, uploads, and
analytics need to work.

## Required Environment

Copy `.env.example` to `.env` locally, and set the same variables in production.

- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: admin login credentials.
- `OPENAI_API_KEY`: enables the live AI assistant.
- `OPENAI_MODEL`: model used by the assistant. Defaults to `gpt-5-nano`.
- `PORTFOLIO_DATA_DIR`: persistent data directory for portfolio JSON, messages,
  and analytics. Use a mounted/persistent volume in production.
- `CORS_ORIGIN`: allowed API origin. Use your production domain instead of `*`
  when the frontend and backend are split across domains.

## Health Check

```bash
curl http://localhost:3001/api/health
```

The response includes whether the OpenAI assistant is configured.

## Legacy Notes Below
