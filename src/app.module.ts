import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './modules/reminders/reminders.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import 'dotenv/config';

@Module({
  imports: [
    BotModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    RemindersModule,
    TreatmentsModule,
  ],
})
export class AppModule {}
