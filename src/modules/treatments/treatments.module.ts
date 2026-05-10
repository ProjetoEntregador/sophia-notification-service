import { Module } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';
import { RemindersModule } from '../../reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  controllers: [TreatmentsController],
  providers: [TreatmentsService, TreatmentsToMedicationService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
