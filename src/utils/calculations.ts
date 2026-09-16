import type { EmbroideryRecord, RecordStatus } from '@/types';

export function calculateAmount(quantity: number, rate: number): number {
  const q = Number(quantity) || 0;
  const r = Number(rate) || 0;
  return Math.round(q * r * 100) / 100;
}

export function determineStatus(record: Pick<EmbroideryRecord, 'creditDate' | 'debitDate' | 'amount'>): RecordStatus {
  const { creditDate, debitDate } = record;
  if (creditDate && debitDate) return 'Settled';
  if (creditDate || debitDate) return 'Partially Settled';
  return 'Pending';
}

export interface PartyAggregate {
  totalRecords: number;
  totalQuantity: number;
  totalAmount: number;
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export function calculatePartySummary(
  partyId: string,
  records: EmbroideryRecord[]
): PartyAggregate {
  const partyRecords = records.filter((r) => r.partyId === partyId && !r.deleted);
  let totalQuantity = 0;
  let totalAmount = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  for (const r of partyRecords) {
    totalQuantity += r.quantity;
    totalAmount += r.amount;
    if (r.creditDate) totalCredit += r.amount;
    if (r.debitDate) totalDebit += r.amount;
  }

  return {
    totalRecords: partyRecords.length,
    totalQuantity: Math.round(totalQuantity * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
    balance: Math.round((totalCredit - totalDebit) * 100) / 100,
  };
}

export interface QualityAggregate {
  totalQuantity: number;
  totalRecords: number;
}

export function calculateQualitySummary(
  qualityId: string,
  records: EmbroideryRecord[]
): QualityAggregate {
  const qualityRecords = records.filter((r) => r.qualityId === qualityId && !r.deleted);
  let totalQuantity = 0;
  for (const r of qualityRecords) {
    totalQuantity += r.quantity;
  }
  return {
    totalQuantity: Math.round(totalQuantity * 100) / 100,
    totalRecords: qualityRecords.length,
  };
}

export function calculateGrandTotal(records: EmbroideryRecord[]): {
  totalAmount: number;
  totalQuantity: number;
  totalRecords: number;
} {
  const active = records.filter((r) => !r.deleted);
  let totalAmount = 0;
  let totalQuantity = 0;
  for (const r of active) {
    totalAmount += r.amount;
    totalQuantity += r.quantity;
  }
  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalQuantity: Math.round(totalQuantity * 100) / 100,
    totalRecords: active.length,
  };
}
