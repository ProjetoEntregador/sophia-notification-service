import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';
import { QUEUES } from './rabbitmq.constants';

@Injectable()
export class IntegrationConsumer implements OnModuleInit {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async onModuleInit() {
    await this.rabbitmq.inboundChannel.addSetup(
      async (channel: ConfirmChannel) => {
        await channel.assertQueue(QUEUES.NEST_INCOMING, {
          durable: true,
        });

        await channel.consume(QUEUES.NEST_INCOMING, async (msg) => {
          if (!msg) return;

          try {
            const data = JSON.parse(msg.content.toString());

            console.log('Integration - ', data);

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
