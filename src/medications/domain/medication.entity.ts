export class Medication {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly quantity: number,
  ) {}

  matches(query: string): boolean {
    const dbName = this.name.trim().toLowerCase();
    const needle = query.trim().toLowerCase();
    return dbName.includes(needle) || needle.includes(dbName);
  }

  withQuantity(quantity: number): Medication {
    return new Medication(this.id, this.userId, this.name, quantity);
  }
}
