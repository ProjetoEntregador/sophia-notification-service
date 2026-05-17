import { Global, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { TesteController } from './teste.controller';
import { IntegrationConsumer } from './integration.consumer';
import { InternalConsumer } from './internal.consumer';
import { BotModule } from '@/bot/bot.module';
import { PharmaciesModule } from '@/pharmacies/pharmacies.module';

@Global()
@Module({
  imports: [BotModule, PharmaciesModule],
  controllers: [TesteController],
  providers: [RabbitMQService, IntegrationConsumer, InternalConsumer],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
