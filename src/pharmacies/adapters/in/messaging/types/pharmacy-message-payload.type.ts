export type PharmacyMedicationPayload = {
  id: string;
  name: string;
  dosage: string;
  pharmaceuticalForm: string;
  manufacturer: string;
  description: string;
  stripe: string;
  prescriptionRequired: boolean;
  unitPrice: number;
  createdAt: string;
};

export type PharmacyPayload = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  distanceKm: number;
  medications: PharmacyMedicationPayload[];
};

export type PharmacyMessagePayload = {
  jid: string;
  pharmacies: PharmacyPayload[];
};
