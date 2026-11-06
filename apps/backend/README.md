# @repo/backend — Next.js REST API Service

Next.js App Router REST API service powering the Toddler platform (`apps/web` and `apps/admin`).

## Features
- **Next.js App Router API Handlers**: Built in `src/app/api/` with typed requests and responses.
- **RESTful API Contracts**: Standardized envelopes (`{ data, meta }` for success and `{ message, errors }` for errors).
- **Workspace Integration**: Shares types, routes, and schemas with `@repo/shared`.

## Scripts
- `pnpm dev`: Start Next.js backend API dev server on port 4000.
- `pnpm build`: Build production Next.js API bundle.
- `pnpm start`: Start production server on port 4000.

