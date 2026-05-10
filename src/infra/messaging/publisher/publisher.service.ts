import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_SERVICE } from '../rabbitmq.module';

@Injectable()
export class PublisherService {
  constructor(
    @Inject(RABBITMQ_SERVICE)
    private readonly rabbitClient: ClientProxy,
  ) {}

  async publish(data: Record<string, unknown>) {
    return this.rabbitClient.emit('task_created', data);
  }
}
