import { forwardRef, Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { MedicationsModule } from '../medications/medications.module';
import { BotModule } from '../bot/bot.module';
import { UsersModule } from '../users/users.module';
import { TreatmentsRepository } from './domain/treatment.repository.port';
import { DrizzleTreatmentsRepository } from './adapters/out/drizzle-treatments.repository';
import { ListTreatmentsUseCase } from './application/use-cases/list-treatments.usecase';
import { RegisterTreatmentUseCase } from './application/use-cases/register-treatment.usecase';
import { UpdateTreatmentUseCase } from './application/use-cases/update-treatment.usecase';
import { DeleteTreatmentUseCase } from './application/use-cases/delete-treatment.usecase';
import { ListUserTreatmentsUseCase } from './application/use-cases/list-user-treatments.usecase';
import { FindTreatmentByMedicationNameUseCase } from './application/use-cases/find-treatment-by-medication-name.usecase';
import { GetTreatmentSummaryUseCase } from './application/use-cases/get-treatment-summary.usecase';
import { UpdateTreatmentIntervalUseCase } from './application/use-cases/update-treatment-interval.usecase';
import { UpdateTreatmentEndDateUseCase } from './application/use-cases/update-treatment-end-date.usecase';
import { RegenerateTreatmentRemindersUseCase } from './application/use-cases/regenerate-treatment-reminders.usecase';
import { CancelTreatmentUseCase } from './application/use-cases/cancel-treatment.usecase';
import { PauseTreatmentUseCase } from './application/use-cases/pause-treatment.usecase';
import { ResumeTreatmentUseCase } from './application/use-cases/resume-treatment.usecase';
import { RegisterTreatmentTool } from './adapters/in/ai-tools/register-treatment.tool';
import { ListMyTreatmentsTool } from './adapters/in/ai-tools/list-my-treatments.tool';
import { UpdateTreatmentTool } from './adapters/in/ai-tools/update-treatment.tool';
import { CancelTreatmentTool } from './adapters/in/ai-tools/cancel-treatment.tool';
import { PauseTreatmentTool } from './adapters/in/ai-tools/pause-treatment.tool';
import { ResumeTreatmentTool } from './adapters/in/ai-tools/resume-treatment.tool';
import { StartTreatmentHandler } from './adapters/in/whatsapp/start-treatment.handler';

@Module({
  imports: [
    forwardRef(() => RemindersModule),
    MedicationsModule,
    forwardRef(() => BotModule),
    UsersModule,
  ],
  providers: [
    { provide: TreatmentsRepository, useClass: DrizzleTreatmentsRepository },
    ListTreatmentsUseCase,
    RegisterTreatmentUseCase,
    UpdateTreatmentUseCase,
    DeleteTreatmentUseCase,
    ListUserTreatmentsUseCase,
    FindTreatmentByMedicationNameUseCase,
    GetTreatmentSummaryUseCase,
    UpdateTreatmentIntervalUseCase,
    UpdateTreatmentEndDateUseCase,
    RegenerateTreatmentRemindersUseCase,
    CancelTreatmentUseCase,
    PauseTreatmentUseCase,
    ResumeTreatmentUseCase,
    RegisterTreatmentTool,
    ListMyTreatmentsTool,
    UpdateTreatmentTool,
    CancelTreatmentTool,
    PauseTreatmentTool,
    ResumeTreatmentTool,
    StartTreatmentHandler,
  ],
  exports: [
    TreatmentsRepository,
    RegisterTreatmentUseCase,
    ListTreatmentsUseCase,
    RegisterTreatmentTool,
    ListMyTreatmentsTool,
    UpdateTreatmentTool,
    CancelTreatmentTool,
    PauseTreatmentTool,
    ResumeTreatmentTool,
    StartTreatmentHandler,
  ],
})
export class TreatmentsModule {}
