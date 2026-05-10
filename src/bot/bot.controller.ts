import { Controller, Post } from '@nestjs/common';
import { MessageSender } from '@/shared/ports/message-sender.port';

@Controller('bot')
export class BotController {
  constructor(private readonly messageSender: MessageSender) {}

  @Post('status')
  async getStatus(): Promise<{ status: string }> {
    try {
      await this.messageSender.sendText(
        '227470443851861@lid',
        'Bot is running!',
      );
      return { status: 'running' };
    } catch (error) {
      return { status: error.message || 'error' };
    }
  }
}
