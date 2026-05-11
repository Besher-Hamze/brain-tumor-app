import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { Scan, ScanSchema } from './schemas/scan.schema';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    PatientsModule,
    MongooseModule.forFeature([{ name: Scan.name, schema: ScanSchema }]),
  ],
  controllers: [ScansController],
  providers: [ScansService],
  exports: [ScansService],
})
export class ScansModule {}
