# SELLSPACE Web

Independent browser frontend built with Vite, React, and TypeScript.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Install dependencies: `npm install`
4. Start the app: `npm run dev`

## Vercel

Set the project Root Directory to `apps/web`.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Node.js: 22.x

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only the Supabase publishable key belongs in browser code. Never use a service-role or secret key here.

## Architecture

This is the first isolated web app in the SELLSPACE repository. The existing Expo app at the repository root is intentionally untouched. Shared domain types and business rules can be extracted into workspace packages after the web and mobile boundaries are stable.