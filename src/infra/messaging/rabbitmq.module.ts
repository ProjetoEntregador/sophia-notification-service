import { Global, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const INCOMING_QUEUE = 'INCOMING_QUEUE';

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
            queue: process.env.MESSAGE_SERVICE_QUEUE!,
            queueOptions: {
              durable: true,
            },
          },
        });
      },
    },
  ],
  exports: [INCOMING_QUEUE],
})
export class RabbitmqModule {}
