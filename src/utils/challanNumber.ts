import type { EmbroideryRecord, AppSettings } from '@/types';

export function generateChallanNumber(
  settings: Pick<AppSettings, 'challanPrefix' | 'challanStartNumber' | 'challanPadding'>,
  existingRecords: EmbroideryRecord[]
): string {
  const { challanPrefix, challanStartNumber, challanPadding } = settings;
  const usedNumbers = new Set<number>();

  for (const r of existingRecords) {
    if (r.deleted) continue;
    const match = r.challanNumber.match(new RegExp(`^${escapeRegex(challanPrefix)}-(\\d+)$`));
    if (match) {
      usedNumbers.add(parseInt(match[1], 10));
    }
  }

  let next = challanStartNumber;
  while (usedNumbers.has(next)) {
    next++;
  }

  return `${challanPrefix}-${String(next).padStart(challanPadding, '0')}`;
}

export function parseChallanNumber(
  challan: string,
  prefix: string
): number | null {
  const match = challan.match(new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`));
  if (match) return parseInt(match[1], 10);
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
