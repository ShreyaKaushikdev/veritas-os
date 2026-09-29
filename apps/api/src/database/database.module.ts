import { Module, Global } from '@nestjs/common';
import { MongoService } from './mongo.service';
import { PrismaService } from '../prisma.service';
import { DatabaseController, DashboardController, JudgingMongoController } from './database.controller';
import { ProjectsMongoController, TrustMongoController } from './projects-mongo.controller';
import { AutopilotController } from './autopilot.controller';
import { DogfoodController } from './dogfood.controller';

@Global()
@Module({
  controllers: [
    DatabaseController,
    DashboardController,
    ProjectsMongoController,
    JudgingMongoController,
    TrustMongoController,
    AutopilotController,
    DogfoodController,
  ],
  providers: [MongoService, PrismaService],
  exports: [MongoService, PrismaService],
})
export class DatabaseModule {}
