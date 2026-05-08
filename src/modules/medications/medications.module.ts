import { Module } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';

@Module({
  controllers: [MedicationsController],
  providers: [MedicationsService, TreatmentsToMedicationService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
