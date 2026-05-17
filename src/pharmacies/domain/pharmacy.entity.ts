export class Pharmacy {
  constructor(
    public readonly name: string,
    public readonly address: string,
    public readonly distanceKm: number,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly phone: string | null,
  ) {}

  distanceLabel(): string {
    if (this.distanceKm < 1) return `${Math.round(this.distanceKm * 1000)} m`;
    return `${this.distanceKm.toFixed(1)} km`;
  }
}
