import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './reminders/reminders.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { PublisherModule } from './message/publisher/publisher.module';
import { ConsumerModule } from './message/consumer/consumer.module';
import { MessageModule } from './message.module';
import { MedicationsModule } from './medications/medications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    BotModule,
    DatabaseModule,
    MessageModule,
    ScheduleModule.forRoot(),
    RemindersModule,
    TreatmentsModule,
    MedicationsModule,
    UsersModule,
    PublisherModule,
    ConsumerModule,
  ],
})
export class AppModule {}
