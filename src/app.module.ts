import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database.module';
import 'dotenv/config';

@Module({
  imports: [BotModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
