import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schemas/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgres://docker:docker@127.0.0.1:5432/project',
  },
} satisfies Config;
