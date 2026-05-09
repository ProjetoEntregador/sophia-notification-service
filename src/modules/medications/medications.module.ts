import { Module } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';

@Module({
  providers: [MedicationsService, TreatmentsToMedicationService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
