import type { EmbroideryRecord, Party, Quality } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface RecordFormData {
  challanNumber: string;
  partyId: string;
  date: string;
  qualityId: string;
  designNumber: string;
  quantity: string;
  rate: string;
  creditDate: string;
  debitDate: string;
  notes: string;
}

export function validateRecord(
  data: RecordFormData,
  parties: Party[],
  qualities: Quality[],
  existingRecords: EmbroideryRecord[],
  editingId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.challanNumber.trim()) {
    errors.challanNumber = 'Challan No. is required';
  } else {
    const duplicate = existingRecords.find(
      (r) =>
        r.challanNumber.toLowerCase() === data.challanNumber.toLowerCase() &&
        !r.deleted &&
        r.id !== editingId
    );
    if (duplicate) {
      errors.challanNumber = 'This challan number already exists';
    }
  }

  if (!data.partyId) {
    errors.partyId = 'Party is required';
  } else if (!parties.find((p) => p.id === data.partyId && !p.deleted)) {
    errors.partyId = 'Please select a valid party';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (!data.qualityId) {
    errors.qualityId = 'Quality is required';
  } else if (!qualities.find((q) => q.id === data.qualityId && !q.deleted)) {
    errors.qualityId = 'Please select a valid quality';
  }

  const quantity = parseFloat(data.quantity);
  if (!data.quantity || isNaN(quantity)) {
    errors.quantity = 'Quantity is required';
  } else if (quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  const rate = parseFloat(data.rate);
  if (data.rate === '' || isNaN(rate)) {
    errors.rate = 'Rate is required';
  } else if (rate < 0) {
    errors.rate = 'Rate cannot be negative';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export interface PartyFormData {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export function validateParty(
  data: PartyFormData,
  existingParties: Party[],
  editingId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Party name is required';
  } else {
    const duplicate = existingParties.find(
      (p) =>
        p.name.toLowerCase() === data.name.trim().toLowerCase() &&
        !p.deleted &&
        p.id !== editingId
    );
    if (duplicate) {
      errors.name = 'A party with this name already exists';
    }
  }

  if (data.phone && !/^[+\d\s()-]{6,15}$/.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export interface QualityFormData {
  name: string;
  designNumber: string;
  defaultRate: string;
  unit: string;
  notes: string;
}

export function validateQuality(
  data: QualityFormData,
  existingQualities: Quality[],
  editingId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Quality name is required';
  } else {
    const duplicate = existingQualities.find(
      (q) =>
        q.name.toLowerCase() === data.name.trim().toLowerCase() &&
        !q.deleted &&
        q.id !== editingId
    );
    if (duplicate) {
      errors.name = 'A quality with this name already exists';
    }
  }

  if (data.defaultRate) {
    const rate = parseFloat(data.defaultRate);
    if (isNaN(rate) || rate < 0) {
      errors.defaultRate = 'Default rate cannot be negative';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
