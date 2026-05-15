import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import * as amqp from 'amqp-connection-manager';

import { ChannelWrapper } from 'amqp-connection-manager';

import { ConfirmChannel } from 'amqplib';

import { EXCHANGES, QUEUES, ROUTING_KEYS } from './rabbitmq.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection = amqp.connect(['amqp://admin:admin@rabbitmq:5672']);
  public internalChannel: ChannelWrapper;
  public outboundChannel: ChannelWrapper;
  public inboundChannel: ChannelWrapper;

  onModuleInit() {
    this.setupInternalChannel();
    this.setupOutboundChannel();
    this.setupInboundChannel();
  }

  private setupInternalChannel() {
    this.internalChannel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EXCHANGES.INTERNAL, 'topic', {
          durable: true,
        });

        await channel.assertQueue(QUEUES.INTERNAL_PROCESSING, {
          durable: true,
        });

        await channel.bindQueue(
          QUEUES.INTERNAL_PROCESSING,
          EXCHANGES.INTERNAL,
          ROUTING_KEYS.INTERNAL_EVENT,
        );

        channel.prefetch(1);
      },
    });
  }

  private setupOutboundChannel() {
    this.outboundChannel = this.connection.createChannel({
      json: true,

      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EXCHANGES.OUTBOUND, 'topic', {
          durable: true,
        });
      },
    });
  }

  private setupInboundChannel() {
    this.inboundChannel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EXCHANGES.INBOUND, 'topic', {
          durable: true,
        });

        await channel.assertQueue(QUEUES.NEST_INCOMING, {
          durable: true,
        });

        await channel.bindQueue(
          QUEUES.NEST_INCOMING,
          EXCHANGES.INBOUND,
          ROUTING_KEYS.NEST_EVENT,
        );

        channel.prefetch(1);
      },
    });
  }

  async publishInternalEvent(payload: unknown) {
    await this.internalChannel.publish(
      EXCHANGES.INTERNAL,
      ROUTING_KEYS.INTERNAL_EVENT,
      Buffer.from(JSON.stringify(payload)),
    );
  }

  async publishToSpring(payload: unknown) {
    await this.outboundChannel.publish(
      EXCHANGES.OUTBOUND,
      ROUTING_KEYS.SPRING_EVENT,
      Buffer.from(JSON.stringify(payload)),
    );
  }

  async onModuleDestroy() {
    await this.connection.close();
  }
}
