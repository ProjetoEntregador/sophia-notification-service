import { Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { TreatmentsRepository } from './domain/treatment.repository.port';
import { DrizzleTreatmentsRepository } from './adapters/out/drizzle-treatments.repository';
import { ListTreatmentsUseCase } from './application/use-cases/list-treatments.usecase';
import { RegisterTreatmentUseCase } from './application/use-cases/register-treatment.usecase';
import { UpdateTreatmentUseCase } from './application/use-cases/update-treatment.usecase';
import { DeleteTreatmentUseCase } from './application/use-cases/delete-treatment.usecase';
import { TreatmentsController } from './adapters/in/treatments.controller';

@Module({
  imports: [RemindersModule],
  controllers: [TreatmentsController],
  providers: [
    { provide: TreatmentsRepository, useClass: DrizzleTreatmentsRepository },
    ListTreatmentsUseCase,
    RegisterTreatmentUseCase,
    UpdateTreatmentUseCase,
    DeleteTreatmentUseCase,
  ],
  exports: [RegisterTreatmentUseCase, ListTreatmentsUseCase],
})
export class TreatmentsModule {}
