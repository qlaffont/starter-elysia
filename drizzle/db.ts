import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schemas';

export const connection = postgres(global.env.DATABASE_URL);

export const db = drizzle(connection, { schema });
