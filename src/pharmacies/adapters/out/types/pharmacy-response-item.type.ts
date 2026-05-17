export type PharmacyResponseItem = {
  name: string;
  address: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  phone?: string | null;
};
