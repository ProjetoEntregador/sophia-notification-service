export class Reminder {
  constructor(
    public readonly id: string,
    public readonly treatmentId: string,
    public readonly scheduledTime: Date,
    public readonly sent: boolean,
    public readonly sentAt: Date | null,
    public readonly confirmed: boolean | null,
    public readonly confirmedAt: Date | null,
  ) {}

  isAwaitingResponse(): boolean {
    return this.sent && this.confirmed === null;
  }

  isExpiredWithoutResponse(now: Date, graceMinutes: number): boolean {
    if (!this.isAwaitingResponse() || !this.sentAt) return false;
    const cutoff = new Date(this.sentAt.getTime() + graceMinutes * 60_000);
    return now > cutoff;
  }

  markSent(at: Date): Reminder {
    if (this.sent) return this;
    return new Reminder(
      this.id,
      this.treatmentId,
      this.scheduledTime,
      true,
      at,
      this.confirmed,
      this.confirmedAt,
    );
  }

  confirm(at: Date): Reminder {
    if (this.confirmed !== null) return this;
    return new Reminder(
      this.id,
      this.treatmentId,
      this.scheduledTime,
      this.sent,
      this.sentAt,
      true,
      at,
    );
  }

  skip(at: Date): Reminder {
    if (this.confirmed !== null) return this;
    return new Reminder(
      this.id,
      this.treatmentId,
      this.scheduledTime,
      this.sent,
      this.sentAt,
      false,
      at,
    );
  }
}
