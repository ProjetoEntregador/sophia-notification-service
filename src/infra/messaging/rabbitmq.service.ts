import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import * as amqp from 'amqp-connection-manager';

import { ChannelWrapper } from 'amqp-connection-manager';

import { ConfirmChannel } from 'amqplib';

import { NotificationEventPayload, PharmacyEventPayload } from '@/@types';
import { AuditEvent } from '@/audit/domain/audit-event';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection = amqp.connect([process.env.MESSAGE_SERVICE_URL]);
  public internalChannel: ChannelWrapper;
  public outboundChannel: ChannelWrapper;
  public inboundChannel: ChannelWrapper;
  public auditChannel: ChannelWrapper;

  onModuleInit() {
    this.setupInternalChannel();
    this.setupOutboundChannel();
    this.setupInboundChannel();
    this.setupAuditChannel();
  }

  private setupInternalChannel() {
    this.internalChannel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(
          process.env.MESSAGE_EXCHANGES_NOTIFICATION,
          'topic',
          {
            durable: true,
          },
        );

        await channel.assertQueue(process.env.MESSAGE_NOTIFICATION_QUEUE, {
          durable: true,
        });

        await channel.bindQueue(
          process.env.MESSAGE_NOTIFICATION_QUEUE,
          process.env.MESSAGE_EXCHANGES_NOTIFICATION,
          process.env.MESSAGE_NOTIFICATION_ROUTING_KEY,
        );

        channel.prefetch(20);
      },
    });
  }

  private setupOutboundChannel() {
    this.outboundChannel = this.connection.createChannel({
      json: true,

      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(
          process.env.MESSAGE_EXCHANGES_PHARMACY,
          'topic',
          {
            durable: true,
          },
        );
      },
    });
  }

  private setupInboundChannel() {
    this.inboundChannel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(
          process.env.MESSAGE_EXCHANGES_PHARMACY,
          'topic',
          {
            durable: true,
          },
        );

        await channel.assertQueue(process.env.MESSAGE_PHARMACY_OUTGOING_QUEUE, {
          durable: true,
        });

        await channel.bindQueue(
          process.env.MESSAGE_PHARMACY_OUTGOING_QUEUE,
          process.env.MESSAGE_EXCHANGES_PHARMACY,
          process.env.MESSAGE_PHARMACY_OUTGOING_ROUTING_KEY,
        );

        channel.prefetch(20);
      },
    });
  }

  private setupAuditChannel() {
    this.auditChannel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(
          process.env.MESSAGE_EXCHANGES_AUDIT,
          'topic',
          {
            durable: true,
          },
        );

        await channel.assertQueue(process.env.MESSAGE_AUDIT_QUEUE, {
          durable: true,
        });

        await channel.bindQueue(
          process.env.MESSAGE_AUDIT_QUEUE,
          process.env.MESSAGE_EXCHANGES_AUDIT,
          process.env.MESSAGE_AUDIT_ROUTING_KEY,
        );

        channel.prefetch(20);
      },
    });
  }

  async publishAuditEvent(payload: AuditEvent) {
    await this.auditChannel.publish(
      process.env.MESSAGE_EXCHANGES_AUDIT!,
      process.env.MESSAGE_AUDIT_ROUTING_KEY!,
      Buffer.from(JSON.stringify(payload)),
    );
  }

  async publishInternalEvent(payload: NotificationEventPayload) {
    await this.internalChannel.publish(
      process.env.MESSAGE_EXCHANGES_NOTIFICATION!,
      process.env.MESSAGE_NOTIFICATION_ROUTING_KEY!,
      Buffer.from(JSON.stringify(payload)),
    );
  }

  async publishToSpring(payload: PharmacyEventPayload) {
    await this.outboundChannel.publish(
      process.env.MESSAGE_EXCHANGES_PHARMACY!,
      process.env.MESSAGE_PHARMACY_INCOMING_ROUTING_KEY!,
      JSON.stringify(payload),
    );
  }

  async publishToAudit(payload: PharmacyEventPayload) {
    await this.auditChannel.publish(
      process.env.MESSAGE_EXCHANGES_PHARMACY!,
      process.env.MESSAGE_AUDIT_ROUTING_KEY!,
      JSON.stringify(payload),
    );
  }

  async onModuleDestroy() {
    await this.connection.close();
  }
}
