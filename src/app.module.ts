import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './reminders/reminders.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { MedicationsModule } from './medications/medications.module';
import { UsersModule } from './users/users.module';
import { RabbitmqModule } from './infra/messaging/rabbitmq.module';
import { PublisherModule } from './infra/messaging/publisher/publisher.module';
import { ConsumerModule } from './infra/messaging/consumer/consumer.module';

@Module({
  imports: [
    BotModule,
    DatabaseModule,
    RabbitmqModule,
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
