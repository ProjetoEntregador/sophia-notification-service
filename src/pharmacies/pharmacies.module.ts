import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '@/bot/bot.module';
import { PharmaciesGateway } from './domain/pharmacies.gateway.port';
import { RabbitMqPharmaciesGateway } from './adapters/out/rabbitmq-pharmacies.gateway';
import { FindNearbyPharmaciesUseCase } from './application/use-cases/find-nearby-pharmacies.usecase';
import { RequestPharmaciesLocationTool } from './adapters/in/ai-tools/request-pharmacies-location.tool';
import { FindNearbyPharmaciesHandler } from './adapters/in/whatsapp/find-nearby-pharmacies.handler';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [
    { provide: PharmaciesGateway, useClass: RabbitMqPharmaciesGateway },
    FindNearbyPharmaciesUseCase,
    RequestPharmaciesLocationTool,
    FindNearbyPharmaciesHandler,
  ],
  exports: [
    FindNearbyPharmaciesUseCase,
    RequestPharmaciesLocationTool,
    FindNearbyPharmaciesHandler,
  ],
})
export class PharmaciesModule {}
