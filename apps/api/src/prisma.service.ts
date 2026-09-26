import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: process.env.DATABASE_URL
        ? { db: { url: process.env.DATABASE_URL } }
        : undefined,
    });
  }

  async onModuleInit() {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgresql://dogfood:dogfood_secret@localhost:5432')) {
        await this.$connect();
      }
    } catch (e) {
      // Prisma postgres fallback - MongoDB is primary active database
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {
      // ignore
    }
  }
}
