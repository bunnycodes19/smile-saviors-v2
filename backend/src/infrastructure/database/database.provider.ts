import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type NestDrizzleDatabase = NodePgDatabase<typeof schema>;

export const DatabaseProvider: Provider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: () => {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:45433/smile_saviors_db';
    const pool = new Pool({
      connectionString,
    });
    return drizzle(pool, { schema });
  },
};
