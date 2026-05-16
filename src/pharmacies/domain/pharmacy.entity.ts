export class Pharmacy {
  constructor(
    public readonly name: string,
    public readonly address: string,
    public readonly distanceMeters: number,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly phone: string | null,
  ) {}

  distanceLabel(): string {
    if (this.distanceMeters < 1000)
      return `${Math.round(this.distanceMeters)} m`;
    return `${(this.distanceMeters / 1000).toFixed(1)} km`;
  }
}
