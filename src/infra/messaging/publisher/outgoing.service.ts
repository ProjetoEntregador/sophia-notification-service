import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OUTGOING_QUEUE } from '../rabbitmq.module';

@Injectable()
export class OutgoingService {
  constructor(
    @Inject(OUTGOING_QUEUE)
    private readonly outgoingClient: ClientProxy,
  ) {}

  handleMessage(data: Record<string, string>) {
    this.outgoingClient.emit('whatsapp.outgoing', data);
  }
}
