import { Module } from '@nestjs/common';
import { IncomingController } from './incoming.controller';
import { MedicationsModule } from '@/medications/medications.module';
import { BotModule } from '@/bot/bot.module';

@Module({
  imports: [MedicationsModule, BotModule],
  controllers: [IncomingController],
})
export class ConsumerModule {}
