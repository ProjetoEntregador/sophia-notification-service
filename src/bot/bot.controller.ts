import { Controller, Get } from '@nestjs/common';
import { MessageSender } from './interfaces/index.js';

@Controller('bot')
export class BotController {
  constructor(private readonly messageSender: MessageSender) {}

  @Get('status')
  async getStatus(): Promise<{ status: string }> {
    await this.messageSender.sendText('43545rwef', 'Bot is running!');
    return { status: 'running' };
  }
}
