import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';
import { MessageRouterInterface } from '@/bot/interfaces';
import { NotificationEventPayload } from '@/@types';

@Injectable()
export class InternalConsumer implements OnModuleInit {
  private readonly logger = new Logger(InternalConsumer.name);

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
              const data = JSON.parse(
                msg.content.toString(),
              ) as NotificationEventPayload;

              this.logger.debug(
                `Internal event recebido: ${data.from} → "${data.text}"`,
              );

              await this.router.route(data.from, data.text);

              channel.ack(msg);
            } catch (error) {
              this.logger.error(
                `Falha ao processar evento interno: ${(error as Error).message}`,
                (error as Error).stack,
              );
              channel.nack(msg, false, true);
            }
          },
        );
      },
    );
  }
}
