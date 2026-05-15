import { Body, Controller, Post } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('debug')
export class TesteController {
  constructor(private readonly client: RabbitMQService) {}

  @Post('teste')
  async handleIncomingMessage(@Body() data: Record<string, string>) {
    console.log('TESTE');
    await this.client.publishToSpring(data);
  }

  @Post('teste-1')
  async handleIncomingMessage2(@Body() data: Record<string, string>) {
    console.log('TESTE 2');
    await this.client.publishInternalEvent(data);
  }
}
