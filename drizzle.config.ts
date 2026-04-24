export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'postgresql',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/dbname',
  },
};
