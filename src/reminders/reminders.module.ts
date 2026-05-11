import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { TreatmentsModule } from '../treatments/treatments.module';
import { UsersModule } from '../users/users.module';
import { Clock } from '../shared/ports/clock.port';
import { SystemClockAdapter } from '../shared/adapters/system-clock.adapter';

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

import { RemindersDispatchCron } from './adapters/in/reminders-dispatch.cron';
import { RemindersAutoSkipCron } from './adapters/in/reminders-auto-skip.cron';
import { ConfirmDoseTool } from './adapters/in/ai-tools/confirm-dose.tool';
import { SkipDoseTool } from './adapters/in/ai-tools/skip-dose.tool';
import { ConfirmDoseHandler } from './adapters/in/whatsapp/confirm-dose.handler';
import { SkipDoseHandler } from './adapters/in/whatsapp/skip-dose.handler';

@Module({
  imports: [
    forwardRef(() => BotModule),
    forwardRef(() => TreatmentsModule),
    UsersModule,
  ],
  providers: [
    { provide: RemindersRepository, useClass: DrizzleRemindersRepository },
    { provide: Clock, useClass: SystemClockAdapter },

    ListRemindersUseCase,
    DeleteReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    CreateInitialReminderUseCase,
    CreateNextReminderUseCase,
    DispatchDueRemindersUseCase,
    AutoSkipExpiredRemindersUseCase,

    RemindersDispatchCron,
    RemindersAutoSkipCron,

    ConfirmDoseTool,
    SkipDoseTool,

    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
  exports: [
    CreateInitialReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    ConfirmDoseTool,
    SkipDoseTool,
    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
})
export class RemindersModule {}
