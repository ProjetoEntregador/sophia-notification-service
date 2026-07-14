import { Injectable, Logger } from '@nestjs/common';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';

@Injectable()
export class RabbitMqPharmaciesGateway extends PharmaciesGateway {
  private readonly logger = new Logger(RabbitMqPharmaciesGateway.name);

  constructor(private readonly outgoingService: RabbitMQService) {
    super();
  }

  async findNearby(
    jid: string,
    latitude: number,
    longitude: number,
    radiusKm = 3,
  ): Promise<void> {
    try {
      await this.outgoingService.publishToSpring({
        jid,
        latitude,
        longitude,
        radiusKm,
      });
    } catch (err) {
      this.logger.error(
        `Falha ao publicar pedido de farmácias para ${jid}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
