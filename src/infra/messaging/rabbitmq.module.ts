import { Global, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { TesteController } from './teste.controller';
import { IntegrationConsumer } from './integration.consumer';
import { InternalConsumer } from './internal.consumer';

@Global()
@Module({
  controllers: [TesteController],
  providers: [RabbitMQService, IntegrationConsumer, InternalConsumer],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
