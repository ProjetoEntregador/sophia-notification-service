import { Global, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const RABBITMQ_SERVICE = 'RABBITMQ_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: RABBITMQ_SERVICE,
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
  exports: [RABBITMQ_SERVICE],
})
export class MessageModule {}
