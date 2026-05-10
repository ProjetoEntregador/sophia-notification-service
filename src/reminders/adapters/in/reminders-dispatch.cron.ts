import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DispatchDueRemindersUseCase } from '@/reminders/application/use-cases/dispatch-due-reminders.usecase';

@Injectable()
export class RemindersDispatchCron {
  private readonly logger = new Logger(RemindersDispatchCron.name);
  private running = false;

  constructor(private readonly dispatch: DispatchDueRemindersUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      await this.dispatch.execute();
    } catch (err) {
      this.logger.error(
        `Falha no dispatch: ${(err as Error).message}`,
        (err as Error).stack,
      );
    } finally {
      this.running = false;
    }
  }
}
