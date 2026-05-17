import { Pharmacy } from './pharmacy.entity';

export abstract class PharmaciesGateway {
  abstract findNearby(
    latitude: number,
    longitude: number,
    radiusKm?: number,
  ): Promise<Pharmacy[]>;
}
