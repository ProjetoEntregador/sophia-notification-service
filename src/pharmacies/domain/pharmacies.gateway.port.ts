export abstract class PharmaciesGateway {
  abstract findNearby(
    jid: string,
    latitude: number,
    longitude: number,
    radiusKm?: number,
  ): Promise<void>;
}
