import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL!;
        const pool = new Pool({ connectionString });
        const db = drizzle({ client: pool });
        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
