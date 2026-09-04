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

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL') || 'postgresql://postgres:*V2%26%24bp9x2x%2BpP3@db.klltjysxikbaqumjvtpn.supabase.co:5432/postgres';
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });
    super({
      adapter,
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
    this.logger.log(
      `PrismaService initialized (DATABASE_URL ${databaseUrl ? 'configured' : 'missing'})`,
    );
    this.logger.log(`Using DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);
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
