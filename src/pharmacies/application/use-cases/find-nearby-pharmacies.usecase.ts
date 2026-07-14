import { BadRequestException, Injectable } from '@nestjs/common';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';

@Injectable()
export class FindNearbyPharmaciesUseCase {
  constructor(private readonly gateway: PharmaciesGateway) {}

  async execute(
    jid: string,
    latitude: number,
    longitude: number,
    radiusKm = 3,
  ): Promise<void> {
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('Coordenadas inválidas');
    }
    await this.gateway.findNearby(jid, latitude, longitude, radiusKm);
  }
}
