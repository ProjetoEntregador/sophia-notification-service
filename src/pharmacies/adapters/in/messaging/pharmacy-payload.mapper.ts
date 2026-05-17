import { Pharmacy } from '@/pharmacies/domain/pharmacy.entity';
import { PharmacyMedication } from '@/pharmacies/domain/pharmacy-medication.entity';
import {
  PharmacyMedicationPayload,
  PharmacyPayload,
} from './types/pharmacy-message-payload.type';

export function toPharmacyMedication(
  raw: PharmacyMedicationPayload,
): PharmacyMedication {
  return new PharmacyMedication(
    raw.id,
    raw.name,
    raw.dosage,
    raw.pharmaceuticalForm,
    raw.manufacturer,
    raw.description,
    raw.stripe,
    raw.prescriptionRequired,
    raw.unitPrice,
    raw.createdAt,
  );
}

export function toPharmacy(raw: PharmacyPayload): Pharmacy {
  return new Pharmacy(
    raw.id,
    raw.name,
    raw.phone,
    raw.address,
    raw.city,
    raw.distanceKm,
    (raw.medications ?? []).map(toPharmacyMedication),
  );
}
