# @repo/backend — Node.js Express REST API Service

Node.js Express REST API service powering the Toddler Daycare platform (`apps/web` and `apps/admin`).

## Features
- **Node.js + Express**: Fast, lightweight TypeScript REST server.
- **RESTful API Contracts**: Standardized envelopes (`{ data, meta }` for success and `{ message, errors }` for errors).
- **CORS & Environment Setup**: Configurable CORS and dotenv loading.
- **Shared Contracts**: Seamless integration with `@repo/shared` schemas and routes.

## Scripts
- `pnpm dev`: Start Express development server with hot-reloading (`tsx watch`) on port 4000.
- `pnpm build`: Build production bundle using `tsup`.
- `pnpm start`: Run production build (`node dist/index.js`).
- `pnpm lint`: Run TypeScript type-checking.
