import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class IntegrationConsumer implements OnModuleInit {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async onModuleInit() {
    await this.rabbitmq.inboundChannel.addSetup(
      async (channel: ConfirmChannel) => {
        await channel.assertQueue(process.env.MESSAGE_PHARMACY_OUTGOING_QUEUE, {
          durable: true,
        });

        await channel.consume(
          process.env.MESSAGE_PHARMACY_OUTGOING_QUEUE,
          async (msg) => {
            if (!msg) return;

            try {
              const data = JSON.parse(msg.content.toString());

              // resposta
              console.log('Integration - ', data);

              channel.ack(msg);
            } catch (error) {
              console.error(error);

              channel.nack(msg, false, true);
            }
          },
        );
      },
    );
  }
}
