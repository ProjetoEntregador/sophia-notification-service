import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersAutoSkipCron } from './reminders-auto-skip.cron';

@Module({
  exports: [RemindersService],
  providers: [RemindersService, RemindersAutoSkipCron],
})
export class RemindersModule {}
