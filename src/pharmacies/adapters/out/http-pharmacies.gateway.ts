import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';

@Injectable()
export class HttpPharmaciesGateway extends PharmaciesGateway {
  private readonly logger = new Logger(HttpPharmaciesGateway.name);

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
      void this.outgoingService.publishToSpring({
        jid,
        latitude,
        longitude,
        radiusKm,
      });
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status ?? 'sem resposta';
        this.logger.error(
          `Falha ao consultar serviço de farmácias (${status}): ${err.message}`,
        );
        throw new Error('serviço de farmácias indisponível');
      }
      throw err;
    }
  }
}
