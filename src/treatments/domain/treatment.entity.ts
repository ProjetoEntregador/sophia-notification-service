export class Treatment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly intervalHours: number,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly medicationIds: string[],
    public readonly cancelledAt: Date | null = null,
    public readonly pausedAt: Date | null = null,
  ) {}

  isCancelled(): boolean {
    return this.cancelledAt !== null;
  }

  isPaused(): boolean {
    return this.pausedAt !== null;
  }

  isActiveAt(date: Date): boolean {
    if (this.isCancelled() || this.isPaused()) return false;
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
      this.cancelledAt,
      this.pausedAt,
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
      this.cancelledAt,
      this.pausedAt,
    );
  }

  withCancellation(at: Date): Treatment {
    return new Treatment(
      this.id,
      this.userId,
      this.intervalHours,
      this.startTime,
      this.endTime,
      this.medicationIds,
      at,
      this.pausedAt,
    );
  }

  withPause(at: Date): Treatment {
    return new Treatment(
      this.id,
      this.userId,
      this.intervalHours,
      this.startTime,
      this.endTime,
      this.medicationIds,
      this.cancelledAt,
      at,
    );
  }

  withResume(): Treatment {
    return new Treatment(
      this.id,
      this.userId,
      this.intervalHours,
      this.startTime,
      this.endTime,
      this.medicationIds,
      this.cancelledAt,
      null,
    );
  }
}
