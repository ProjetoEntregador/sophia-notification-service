import { BadRequestException, Injectable } from '@nestjs/common';
import { PharmaciesGateway } from '@/pharmacies/domain/pharmacies.gateway.port';
import { Pharmacy } from '@/pharmacies/domain/pharmacy.entity';

@Injectable()
export class FindNearbyPharmaciesUseCase {
  constructor(private readonly gateway: PharmaciesGateway) {}

  async execute(
    latitude: number,
    longitude: number,
    radiusMeters = 3000,
  ): Promise<Pharmacy[]> {
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
    return this.gateway.findNearby(latitude, longitude, radiusMeters);
  }
}
