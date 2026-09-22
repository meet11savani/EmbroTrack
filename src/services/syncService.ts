import type { EmbroideryRecord, Party, Quality, SyncStatus } from '@/types';
import { storage, type SyncQueueItem } from './localStorage';
import { googleSheets } from './googleSheets';

export interface SyncState {
  status: 'local' | 'synced' | 'syncing' | 'pending' | 'error';
  pendingCount: number;
  lastSync: string | null;
  error: string | null;
}

export function getPendingCount(): number {
  return storage.getSyncQueue().length;
}

export function markSynced(
  records: EmbroideryRecord[],
  parties: Party[],
  qualities: Quality[]
): { records: EmbroideryRecord[]; parties: Party[]; qualities: Quality[] } {
  return {
    records: records.map((r) => ({ ...r, syncStatus: 'synced' as SyncStatus })),
    parties: parties.map((p) => ({ ...p, syncStatus: 'synced' as SyncStatus })),
    qualities: qualities.map((q) => ({ ...q, syncStatus: 'synced' as SyncStatus })),
  };
}

export function mergeRecords(
  local: EmbroideryRecord[],
  remote: EmbroideryRecord[]
): EmbroideryRecord[] {
  const map = new Map<string, EmbroideryRecord>();
  for (const r of local) map.set(r.id, r);
  for (const r of remote) {
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, { ...r, syncStatus: 'synced' });
    } else {
      const localUpdated = new Date(existing.updatedAt).getTime();
      const remoteUpdated = new Date(r.updatedAt || 0).getTime();
      if (remoteUpdated > localUpdated) {
        map.set(r.id, { ...r, syncStatus: 'synced' });
      }
    }
  }
  return Array.from(map.values());
}

export function mergeParties(local: Party[], remote: Party[]): Party[] {
  const map = new Map<string, Party>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    const existing = map.get(p.id);
    if (!existing) {
      map.set(p.id, { ...p, syncStatus: 'synced' });
    } else {
      const localUpdated = new Date(existing.updatedAt).getTime();
      const remoteUpdated = new Date(p.updatedAt || 0).getTime();
      if (remoteUpdated > localUpdated) {
        map.set(p.id, { ...p, syncStatus: 'synced' });
      }
    }
  }
  return Array.from(map.values());
}

export function mergeQualities(local: Quality[], remote: Quality[]): Quality[] {
  const map = new Map<string, Quality>();
  for (const q of local) map.set(q.id, q);
  for (const q of remote) {
    const existing = map.get(q.id);
    if (!existing) {
      map.set(q.id, { ...q, syncStatus: 'synced' });
    } else {
      const localUpdated = new Date(existing.updatedAt).getTime();
      const remoteUpdated = new Date(q.updatedAt || 0).getTime();
      if (remoteUpdated > localUpdated) {
        map.set(q.id, { ...q, syncStatus: 'synced' });
      }
    }
  }
  return Array.from(map.values());
}

export interface SyncResult {
  success: boolean;
  syncedRecords: number;
  pulledRecords: number;
  error?: string;
}

export async function syncNow(
  scriptUrl: string,
  records: EmbroideryRecord[],
  parties: Party[],
  qualities: Quality[]
): Promise<SyncResult> {
  if (!scriptUrl) {
    return { success: false, syncedRecords: 0, pulledRecords: 0, error: 'Google Sheets URL not configured' };
  }

  const settings = storage.getSettings();

  try {
    const response = await googleSheets.syncAll(scriptUrl, { records, parties, qualities, settings });

    let pulled = 0;
    if (response.records || response.parties || response.qualities) {
      pulled = (response.records?.length ?? 0) + (response.parties?.length ?? 0) + (response.qualities?.length ?? 0);
    }

    storage.saveSyncQueue([]);
    return {
      success: true,
      syncedRecords: records.length + parties.length + qualities.length,
      pulledRecords: pulled,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    return { success: false, syncedRecords: 0, pulledRecords: 0, error: message };
  }
}

export function addToSyncQueue(
  entityType: SyncQueueItem['entityType'],
  operation: SyncQueueItem['operation'],
  entityId: string,
  data: unknown
): void {
  const queue = storage.getSyncQueue();
  queue.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    entityType,
    operation,
    entityId,
    data,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  });
  storage.saveSyncQueue(queue);
}
