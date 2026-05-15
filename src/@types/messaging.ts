export type NotificationEventPayload = {
  from: string;
  text: string;
};

export type PharmacyEventPayload = {
  longitude: string;
  latitude: string;
  radius: number;
};
