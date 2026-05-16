export type PharmacyResponseItem = {
  name: string;
  address: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  phone?: string | null;
};
