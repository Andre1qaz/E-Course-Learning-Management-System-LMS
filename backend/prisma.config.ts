import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:*V2%26%24bp9x2x%2BpP3@db.klltjysxikbaqumjvtpn.supabase.co:5432/postgres',
  },
});
