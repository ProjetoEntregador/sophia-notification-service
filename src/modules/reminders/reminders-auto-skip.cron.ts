import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

const REMINDER_GRACE_MINUTES = 5;
// const REMINDER_GRACE_MINUTES = 30;

@Injectable()
export class RemindersAutoSkipCron {
  private readonly logger = new Logger(RemindersAutoSkipCron.name);
  private running = false;

  constructor(private readonly reminders: RemindersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const skipped = await this.reminders.autoSkipExpired(
        REMINDER_GRACE_MINUTES,
      );
      if (skipped.length > 0) {
        this.logger.log(
          `Auto-skip: ${skipped.length} dose(s) sem resposta após ${REMINDER_GRACE_MINUTES}min — próximas geradas`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Falha no auto-skip: ${(err as Error).message}`,
        (err as Error).stack,
      );
    } finally {
      this.running = false;
    }
  }
}
