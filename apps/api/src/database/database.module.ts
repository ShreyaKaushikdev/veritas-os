import { Module, Global } from '@nestjs/common';
import { MongoService } from './mongo.service';
import { DatabaseController, DashboardController, JudgingMongoController } from './database.controller';
import { ProjectsMongoController, TrustMongoController } from './projects-mongo.controller';
import { AutopilotController } from './autopilot.controller';

@Global()
@Module({
  controllers: [
    DatabaseController,
    DashboardController,
    ProjectsMongoController,
    JudgingMongoController,
    TrustMongoController,
    AutopilotController,
  ],
  providers: [MongoService],
  exports: [MongoService],
})
export class DatabaseModule {}
