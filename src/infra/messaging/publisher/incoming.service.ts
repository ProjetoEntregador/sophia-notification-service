import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { INCOMING_QUEUE } from '../rabbitmq.module';

@Injectable()
export class IncomingService {
  constructor(
    @Inject(INCOMING_QUEUE)
    private readonly incomingClient: ClientProxy,
  ) {}

  handleMessage(data: Record<string, string>) {
    this.incomingClient.emit('whatsapp.incoming', data);
  }
}
