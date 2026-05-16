import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';
import { MessageRouterInterface } from '@/bot/interfaces';

@Injectable()
export class InternalConsumer implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly router: MessageRouterInterface,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.internalChannel.addSetup(
      async (channel: ConfirmChannel) => {
        await channel.assertQueue(process.env.MESSAGE_NOTIFICATION_QUEUE, {
          durable: true,
        });

        await channel.consume(
          process.env.MESSAGE_NOTIFICATION_QUEUE,
          async (msg) => {
            if (!msg) return;

            try {
              const data = JSON.parse(msg.content.toString());

              void this.router.route(data.from, data.text);
              console.log('Internal - ', data);

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
