import { Global, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const INCOMING_QUEUE = 'INCOMING_QUEUE';
export const OUTGOING_QUEUE = 'OUTGOING_QUEUE';

@Global()
@Module({
  providers: [
    {
      provide: INCOMING_QUEUE,
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.MESSAGE_SERVICE_URL!],
            queue: 'incoming_messages',
            queueOptions: {
              durable: true,
            },
          },
        });
      },
    },
    {
      provide: OUTGOING_QUEUE,
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.MESSAGE_SERVICE_URL!],
            queue: 'outgoing_messages',
            queueOptions: {
              durable: true,
            },
          },
        });
      },
    },
  ],
  exports: [INCOMING_QUEUE, OUTGOING_QUEUE],
})
export class RabbitmqModule {}
