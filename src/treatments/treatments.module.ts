import { forwardRef, Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { MedicationsModule } from '../medications/medications.module';
import { BotModule } from '../bot/bot.module';
import { TreatmentsRepository } from './domain/treatment.repository.port';
import { DrizzleTreatmentsRepository } from './adapters/out/drizzle-treatments.repository';
import { ListTreatmentsUseCase } from './application/use-cases/list-treatments.usecase';
import { RegisterTreatmentUseCase } from './application/use-cases/register-treatment.usecase';
import { UpdateTreatmentUseCase } from './application/use-cases/update-treatment.usecase';
import { DeleteTreatmentUseCase } from './application/use-cases/delete-treatment.usecase';
import { TreatmentsController } from './adapters/in/treatments.controller';
import { RegisterTreatmentTool } from './adapters/in/ai-tools/register-treatment.tool';
import { StartTreatmentHandler } from './adapters/in/whatsapp/start-treatment.handler';

@Module({
  imports: [
    forwardRef(() => RemindersModule),
    MedicationsModule,
    forwardRef(() => BotModule),
  ],
  controllers: [TreatmentsController],
  providers: [
    { provide: TreatmentsRepository, useClass: DrizzleTreatmentsRepository },
    ListTreatmentsUseCase,
    RegisterTreatmentUseCase,
    UpdateTreatmentUseCase,
    DeleteTreatmentUseCase,
    RegisterTreatmentTool,
    StartTreatmentHandler,
  ],
  exports: [
    TreatmentsRepository,
    RegisterTreatmentUseCase,
    ListTreatmentsUseCase,
    RegisterTreatmentTool,
    StartTreatmentHandler,
  ],
})
export class TreatmentsModule {}
