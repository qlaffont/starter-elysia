# STARTER ELYSIA

## Server requirements

- Bun
- Postgres database ( or Docker for development )

## Features

- Elysia
- REST
- GraphQL (Yoga)
- ORM (Drizzle)
- Authentication
- Rate Limit (REST/GraphQL)
- Unify all errors from `unify-errors`
- Test included

## How to start the project ?

### Local

- Fill environment variables to `.env` file based on `.env.example`
- Start server `bun dev`
- (optional) If you want to use OpenTelemetry : `bun run dev:telemetry`

### Deployed environments

- Fill environment variables to `.env` file based on `.env.example`
- Start server  `bun start`
- (optional) If you want to use OpenTelemetry : `bun run start:telemetry`

## Package Scripts

- `dev` : Start Dev server (hot reload activated)
- `start` : Start server in production mode
- `lint` : Lint all files
- `migration:up` : deploy migrations
- `migration:make` : generate migration
- `migration:reset` : reset migrations + data
- `migration:studio` : Start Drizzle Studio
- `prepare` : Install husky
