import { Module } from '@nestjs/common';
import { TreatmentsToMedicationService } from './treatmentsToMedication.service';

@Module({
  controllers: [],
  providers: [TreatmentsToMedicationService],
  exports: [TreatmentsToMedicationService],
})
export class TreatmentsToMedicationModule {}
