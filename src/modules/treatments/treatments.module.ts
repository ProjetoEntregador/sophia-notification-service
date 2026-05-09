import { Module } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  providers: [TreatmentsService, TreatmentsToMedicationService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
