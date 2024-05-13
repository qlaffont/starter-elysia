import 'dotenv/config';

import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schemas/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
