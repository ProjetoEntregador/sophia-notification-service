import 'dotenv/config';
import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { BotModule } from 'src/bot/bot.module';
import { DatabaseModule } from 'src/db/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from 'src/reminders/reminders.module';
import { TreatmentsModule } from 'src/treatments/treatments.module';
import { MedicationsModule } from 'src/medications/medications.module';
import { UsersModule } from 'src/users/users.module';
import { PharmaciesModule } from 'src/pharmacies/pharmacies.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '../messaging/rabbitmq.module';
import { AuditModule } from '@/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SharedModule,
    RabbitMQModule,
    AuditModule,
    BotModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    RemindersModule,
    TreatmentsModule,
    MedicationsModule,
    UsersModule,
    PharmaciesModule,
  ],
})
export class AppModule {}
