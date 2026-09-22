import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TestHelpers } from './test-helpers.util';

// Load test-specific env (DATABASE_URL, JWT_SECRET, etc.) before anything else.
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(process.cwd(), '.env.test') });
}

/**
 * TestDatabase manages a PrismaClient connection to the dedicated test
 * database (see backend/.env.test). Integration specs must call connect()
 * in beforeAll and disconnect() in afterAll.
 */
export class TestDatabase {
  private static prisma: PrismaClient | null = null;

  static getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Configure backend/.env.test before running integration tests.',
      );
    }
    return url;
  }

  static async connect(): Promise<PrismaClient> {
    if (TestDatabase.prisma) {
      return TestDatabase.prisma;
    }

    const adapter = new PrismaPg({
      connectionString: TestDatabase.getDatabaseUrl(),
    });

    TestDatabase.prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });

    await TestDatabase.prisma.$connect();
    return TestDatabase.prisma;
  }

  static getPrisma(): PrismaClient {
    if (!TestDatabase.prisma) {
      throw new Error(
        'TestDatabase is not connected. Call TestDatabase.connect() first.',
      );
    }
    return TestDatabase.prisma;
  }

  static async cleanup(): Promise<void> {
    if (!TestDatabase.prisma) {
      return;
    }
    await TestHelpers.cleanupDatabase(TestDatabase.prisma);
  }

  static async disconnect(): Promise<void> {
    if (TestDatabase.prisma) {
      await TestDatabase.prisma.$disconnect();
      TestDatabase.prisma = null;
    }
  }
}