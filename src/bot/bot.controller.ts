import { Controller, Get } from '@nestjs/common';
import { SocketProviderInterface } from './interfaces/index';

@Controller('bot')
export class BotController {
  constructor(private readonly socketProvider: SocketProviderInterface) {}

  @Get('status')
  getStatus(): { connected: boolean } {
    try {
      this.socketProvider.getSocket();
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }
}
