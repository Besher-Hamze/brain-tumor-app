import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScansModule } from '../scans/scans.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { Analysis, AnalysisSchema } from './schemas/analysis.schema';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    ScansModule,
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
