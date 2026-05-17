export class PharmacyMedication {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly dosage: string,
    public readonly pharmaceuticalForm: string,
    public readonly manufacturer: string,
    public readonly description: string,
    public readonly stripe: string,
    public readonly prescriptionRequired: boolean,
    public readonly unitPrice: number,
    public readonly createdAt: string,
  ) {}

  priceLabel(): string {
    if (!Number.isFinite(this.unitPrice)) return 'preço indisponível';
    return `R$ ${this.unitPrice.toFixed(2).replace('.', ',')}`;
  }

  stripeEmoji(): string {
    const normalized = (this.stripe ?? '').toLowerCase().trim();
    if (!normalized) return '';
    if (normalized.includes('verm') || normalized === 'red') return '🔴';
    if (normalized.includes('pret') || normalized === 'black') return '⚫';
    return '';
  }
}
