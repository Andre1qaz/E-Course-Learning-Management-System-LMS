import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

  // NOTE: no manual static-singleton hack here. PrismaService is registered
  // exactly once, in the @Global() PrismaModule, so Nest's own DI container
  // already guarantees a single instance app-wide. If you ever see multiple
  // "PrismaService initialized" logs again, the real bug is a module
  // re-declaring PrismaService in its own `providers` array — fix that
  // instead of re-adding a singleton workaround here.
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const directUrl = configService.get<string>('DIRECT_URL');

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Configure it in the environment (Render dashboard) — refusing to start with a fallback connection string.',
      );
    }

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });
    super({
      adapter,
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
    this.logger.log('PrismaService initialized (DATABASE_URL configured)');
    if (directUrl) {
      this.logger.log('DIRECT_URL configured (used by Prisma CLI for migrations)');
    }
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      // Retry connection after 5 seconds
      setTimeout(() => {
        this.logger.log('Retrying database connection...');
        this.$connect().catch(err => {
          this.logger.error('Retry failed:', err);
        });
      }, 5000);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
