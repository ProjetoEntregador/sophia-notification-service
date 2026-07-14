import { PharmacyMedication } from './pharmacy-medication.entity';

export class Pharmacy {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly city: string,
    public readonly distanceKm: number,
    public readonly medications: PharmacyMedication[],
  ) {}

  distanceLabel(): string {
    if (this.distanceKm < 1) return `${Math.round(this.distanceKm * 1000)} m`;
    return `${this.distanceKm.toFixed(1)} km`;
  }
}
