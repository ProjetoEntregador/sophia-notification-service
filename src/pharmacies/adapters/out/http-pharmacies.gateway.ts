import { Injectable, Logger } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';
import { Pharmacy } from '@/pharmacies/domain/pharmacy.entity';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';
import { PharmacyResponse } from './types/pharmacy-response.type';

@Injectable()
export class HttpPharmaciesGateway extends PharmaciesGateway {
  private readonly logger = new Logger(HttpPharmaciesGateway.name);
  private readonly baseUrl = process.env.PHARMACY_SERVICE_URL ?? '';
  private readonly timeoutMs = Number(
    process.env.PHARMACY_SERVICE_TIMEOUT_MS ?? 10000,
  );

  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters = 3000,
  ): Promise<Pharmacy[]> {
    if (!this.baseUrl) {
      this.logger.warn(
        'PHARMACY_SERVICE_URL não configurada — retornando lista vazia',
      );
      return [];
    }

    try {
      const { data } = await axios.post<PharmacyResponse>(
        `${this.baseUrl}/nearby`,
        { latitude, longitude, radiusMeters },
        { timeout: this.timeoutMs },
      );
      return (data.pharmacies ?? []).map(
        (p) =>
          new Pharmacy(
            p.name,
            p.address,
            p.distanceMeters,
            p.latitude,
            p.longitude,
            p.phone ?? null,
          ),
      );
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status ?? 'no-status';
        this.logger.error(
          `Falha ao consultar serviço de farmácias (${status}): ${err.message}`,
        );
        throw new Error(`Serviço de farmácias indisponível (${status})`);
      }
      throw err;
    }
  }
}
