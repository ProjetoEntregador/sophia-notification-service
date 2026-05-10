export type DueReminderProjection = {
  reminderId: string;
  treatmentId: string;
  scheduledTime: Date;
  jid: string;
  medicationNames: string[];
  previousSkipped: boolean;
};
