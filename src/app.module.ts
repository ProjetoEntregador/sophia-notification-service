import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './modules/reminders/reminders.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { UsersModule } from './modules/users/users.module';
import { TreatmentsToMedicationModule } from './modules/treatmentsToMedication/treatmentsToMedication.module';

@Module({
  imports: [
    BotModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    RemindersModule,
    TreatmentsModule,
    MedicationsModule,
    TreatmentsToMedicationModule,
    UsersModule,
  ],
})
export class AppModule {}
