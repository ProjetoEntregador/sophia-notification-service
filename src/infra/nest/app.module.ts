import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BotModule } from 'src/bot/bot.module';
import { DatabaseModule } from 'src/db/database.module';
import { RabbitmqModule } from '../messaging/rabbitmq.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from 'src/reminders/reminders.module';
import { TreatmentsModule } from 'src/treatments/treatments.module';
import { MedicationsModule } from 'src/medications/medications.module';
import { UsersModule } from 'src/users/users.module';
import { PharmaciesModule } from 'src/pharmacies/pharmacies.module';
import { PublisherModule } from '../messaging/publisher/publisher.module';
import { ConsumerModule } from '../messaging/consumer/consumer.module';

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
    PharmaciesModule,
    PublisherModule,
    ConsumerModule,
  ],
})
export class AppModule {}
