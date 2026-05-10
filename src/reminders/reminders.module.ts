import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { Clock } from '../shared/ports/clock.port';
import { SystemClockAdapter } from '../shared/adapters/system-clock.adapter';

import { RemindersRepository } from './domain/reminders.repository.port';
import { DrizzleRemindersRepository } from './adapters/out/drizzle-reminders.repository';

import { ListRemindersUseCase } from './application/use-cases/list-reminders.usecase';
import { DeleteReminderUseCase } from './application/use-cases/delete-reminder.usecase';
import { ConfirmDoseUseCase } from './application/use-cases/confirm-dose.usecase';
import { SkipDoseUseCase } from './application/use-cases/skip-dose.usecase';
import { CreateInitialReminderUseCase } from './application/use-cases/create-initial-reminder.usecase';
import { DispatchDueRemindersUseCase } from './application/use-cases/dispatch-due-reminders.usecase';
import { AutoSkipExpiredRemindersUseCase } from './application/use-cases/auto-skip-expired-reminders.usecase';

import { RemindersController } from './adapters/in/reminders.controller';
import { RemindersDispatchCron } from './adapters/in/reminders-dispatch.cron';
import { RemindersAutoSkipCron } from './adapters/in/reminders-auto-skip.cron';

@Module({
  imports: [forwardRef(() => BotModule)],
  controllers: [RemindersController],
  providers: [
    // out
    { provide: RemindersRepository, useClass: DrizzleRemindersRepository },
    { provide: Clock, useClass: SystemClockAdapter },

    // application
    ListRemindersUseCase,
    DeleteReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    CreateInitialReminderUseCase,
    DispatchDueRemindersUseCase,
    AutoSkipExpiredRemindersUseCase,

    // in (crons)
    RemindersDispatchCron,
    RemindersAutoSkipCron,
  ],
  exports: [CreateInitialReminderUseCase, ConfirmDoseUseCase, SkipDoseUseCase],
})
export class RemindersModule {}
