export class Treatment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly intervalHours: number,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly medicationIds: string[],
  ) {}

  isActiveAt(date: Date): boolean {
    return date >= this.startTime && date <= this.endTime;
  }

  nextDoseAfter(reference: Date): Date {
    return new Date(reference.getTime() + this.intervalHours * 60 * 60 * 1000);
  }

  withExtendedEndBy(byMs: number): Treatment {
    return new Treatment(
      this.id,
      this.userId,
      this.intervalHours,
      this.startTime,
      new Date(this.endTime.getTime() + byMs),
      this.medicationIds,
    );
  }

  withMedicationIds(ids: string[]): Treatment {
    return new Treatment(
      this.id,
      this.userId,
      this.intervalHours,
      this.startTime,
      this.endTime,
      ids,
    );
  }
}
