# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sales Compass 95 (MoodlyCRM) is a React + TypeScript SPA for pharmaceutical sales teams. It uses Vite for dev/build, Supabase (hosted) as backend-as-a-service, and Google Maps APIs for map features.

### Running the app

- **Dev server:** `npm run dev` — starts Vite on port 8080
- **Tests:** `npm run test` (Vitest)
- **Build:** `npm run build`
- **Lint:** `npm run lint`

See `README.md` for all available scripts and project structure.

### Known issues

- `npm run lint` fails due to a version incompatibility between `eslint@9.39.2` and `typescript-eslint@8.14.0` pinned in `package-lock.json`. The `@typescript-eslint/no-unused-expressions` rule crashes at runtime. This is a pre-existing issue in the lockfile.

### Architecture notes

- No local backend or database required. The app connects to a remote hosted Supabase instance (credentials in `.env`).
- Supabase Auth requires email verification for new accounts. To test authenticated features, you need a test account with a confirmed email.
- Google Maps features require a valid `VITE_GOOGLE_MAPS_API_KEY` (already in `.env`).
- Supabase Edge Functions run remotely; local testing requires `supabase functions serve`.
