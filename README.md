# Toddler Monorepo — Next.js + Admin + Next.js Backend

## Stack

- `apps/backend` — Next.js App Router REST API backend (JWT auth, RBAC roles, daycares, inquiries)
- `apps/web` — Next.js App Router public daycare portal
- `apps/admin` — Vite + React admin console
- `packages/shared` — types, permissions, zod schemas
- `packages/ui` — shared React components (optional)
- `packages/config` — tsconfig + env helper

## Quick start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
# edit MONGODB_URI + JWT secrets
pnpm --filter @repo/backend seed:roles
pnpm --filter @repo/backend seed:admin
pnpm dev
```

- API: http://localhost:4000 (docs at /api/docs)
- Web: http://localhost:3000
- Admin: http://localhost:5173 (or 5174 per vite config)

Default seed admin: `admin@example.com / Admin@12345` (override via SEED_* env).

## Add a new module

1. Backend: create `apps/backend/src/modules/<name>/` with `.model.ts`, `.service.ts`, `.controller.ts`, `.routes.ts`
2. Mount router in `apps/backend/src/app.ts` (`/api/v1/...`) and admin router in `apps/backend/src/modules/admin/admin.routes.ts` with `authorizePermission()`
3. Add permission keys in `packages/shared/src/constants/permissions.ts`
4. Admin: add page in `apps/admin/src/pages/` + route in `App.tsx` + sidebar link
5. Web: add route in `apps/web/src/app/`

## Env

See `apps/backend/.env.example`. Web uses `NEXT_PUBLIC_API_URL`, admin uses `VITE_API_URL`.

## Backup

Original hospitality code is preserved on branch `backup/wess-hospitality-full-20261015`.
