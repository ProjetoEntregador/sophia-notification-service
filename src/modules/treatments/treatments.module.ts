import { Module } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';

@Module({
  controllers: [TreatmentsController],
  providers: [TreatmentsService, TreatmentsToMedicationService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
