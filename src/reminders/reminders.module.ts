import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { TreatmentsModule } from '../treatments/treatments.module';
import { MedicationsModule } from '../medications/medications.module';
import { UsersModule } from '../users/users.module';

import { RemindersRepository } from './domain/reminders.repository.port';
import { DrizzleRemindersRepository } from './adapters/out/drizzle-reminders.repository';

import { ListRemindersUseCase } from './application/use-cases/list-reminders.usecase';
import { DeleteReminderUseCase } from './application/use-cases/delete-reminder.usecase';
import { ConfirmDoseUseCase } from './application/use-cases/confirm-dose.usecase';
import { SkipDoseUseCase } from './application/use-cases/skip-dose.usecase';
import { CreateInitialReminderUseCase } from './application/use-cases/create-initial-reminder.usecase';
import { CreateNextReminderUseCase } from './application/use-cases/create-next-reminder.usecase';
import { DispatchDueRemindersUseCase } from './application/use-cases/dispatch-due-reminders.usecase';
import { AutoSkipExpiredRemindersUseCase } from './application/use-cases/auto-skip-expired-reminders.usecase';
import { ListTodayRemindersUseCase } from './application/use-cases/list-today-reminders.usecase';
import { ListUpcomingRemindersUseCase } from './application/use-cases/list-upcoming-reminders.usecase';
import { GetAdherenceReportUseCase } from './application/use-cases/get-adherence-report.usecase';

import { RemindersDispatchCron } from './adapters/in/reminders-dispatch.cron';
import { RemindersAutoSkipCron } from './adapters/in/reminders-auto-skip.cron';
import { ConfirmDoseTool } from './adapters/in/ai-tools/confirm-dose.tool';
import { SkipDoseTool } from './adapters/in/ai-tools/skip-dose.tool';
import { ListTodayRemindersTool } from './adapters/in/ai-tools/list-today-reminders.tool';
import { ListUpcomingRemindersTool } from './adapters/in/ai-tools/list-upcoming-reminders.tool';
import { GetAdherenceReportTool } from './adapters/in/ai-tools/get-adherence-report.tool';
import { ConfirmDoseHandler } from './adapters/in/whatsapp/confirm-dose.handler';
import { SkipDoseHandler } from './adapters/in/whatsapp/skip-dose.handler';

@Module({
  imports: [
    forwardRef(() => BotModule),
    forwardRef(() => TreatmentsModule),
    MedicationsModule,
    UsersModule,
  ],
  providers: [
    { provide: RemindersRepository, useClass: DrizzleRemindersRepository },

    ListRemindersUseCase,
    DeleteReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    CreateInitialReminderUseCase,
    CreateNextReminderUseCase,
    DispatchDueRemindersUseCase,
    AutoSkipExpiredRemindersUseCase,
    ListTodayRemindersUseCase,
    ListUpcomingRemindersUseCase,
    GetAdherenceReportUseCase,

    RemindersDispatchCron,
    RemindersAutoSkipCron,

    ConfirmDoseTool,
    SkipDoseTool,
    ListTodayRemindersTool,
    ListUpcomingRemindersTool,
    GetAdherenceReportTool,

    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
  exports: [
    RemindersRepository,
    CreateInitialReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    ConfirmDoseTool,
    SkipDoseTool,
    ListTodayRemindersTool,
    ListUpcomingRemindersTool,
    GetAdherenceReportTool,
    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
})
export class RemindersModule {}
