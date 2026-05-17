import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfirmChannel } from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';
import { FindNearbyPharmaciesHandler } from '@/pharmacies/adapters/in/whatsapp/find-nearby-pharmacies.handler';

@Injectable()
export class IntegrationConsumer implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly pharmacyHandler: FindNearbyPharmaciesHandler,
  ) {}

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
              const { jid, pharmacies } = JSON.parse(msg.content.toString());

              if (pharmacies.length === 0) {
                await this.pharmacyHandler.replyNoResults(jid);
              } else {
                await this.pharmacyHandler.replyResults(jid, pharmacies);
              }

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
