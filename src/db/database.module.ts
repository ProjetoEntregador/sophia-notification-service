import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DATABASE = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => {
        const connectionString = process.env.NOTIFICATION_DATABASE_URL!;
        const pool = new Pool({ connectionString });
        const db = drizzle({ client: pool });
        return db;
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
