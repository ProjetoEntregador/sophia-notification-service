export type NotificationEventPayload = {
  from: string;
  text: string;
};

export type PharmacyEventPayload = {
  jid: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
};
