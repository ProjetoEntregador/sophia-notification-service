import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';
import { QUEUES } from './rabbitmq.constants';

@Injectable()
export class InternalConsumer implements OnModuleInit {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async onModuleInit() {
    await this.rabbitmq.internalChannel.addSetup(
      async (channel: ConfirmChannel) => {
        await channel.assertQueue(QUEUES.INTERNAL_PROCESSING, {
          durable: true,
        });

        await channel.consume(QUEUES.INTERNAL_PROCESSING, async (msg) => {
          if (!msg) return;

          try {
            const data = JSON.parse(msg.content.toString());

            console.log('Internal - ', data);

            channel.ack(msg);
          } catch (error) {
            console.error(error);

            channel.nack(msg, false, false);
          }
        });
      },
    );
  }
}
