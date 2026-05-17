import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';

@Injectable()
export class HttpPharmaciesGateway extends PharmaciesGateway {
  private readonly logger = new Logger(HttpPharmaciesGateway.name);
  private readonly baseUrl = process.env.PHARMACY_SERVICE_URL ?? '';

  constructor(private readonly outgoingService: RabbitMQService) {
    super();
  }

  async findNearby(
    jid: string,
    latitude: number,
    longitude: number,
    radiusKm = 3,
  ): Promise<void> {
    if (!this.baseUrl) {
      this.logger.warn(
        'PHARMACY_SERVICE_URL não configurada — retornando lista vazia',
      );
      return;
    }

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
