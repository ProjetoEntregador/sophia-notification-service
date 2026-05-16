import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BotModule } from 'src/bot/bot.module';
import { DatabaseModule } from 'src/db/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from 'src/reminders/reminders.module';
import { TreatmentsModule } from 'src/treatments/treatments.module';
import { MedicationsModule } from 'src/medications/medications.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '../messaging/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RabbitMQModule,
    BotModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    RemindersModule,
    TreatmentsModule,
    MedicationsModule,
    UsersModule,
  ],
})
export class AppModule {}
