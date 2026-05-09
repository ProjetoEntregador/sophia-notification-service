import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersAutoSkipCron } from './reminders-auto-skip.cron';

@Module({
  exports: [RemindersService],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersAutoSkipCron],
})
export class RemindersModule {}
