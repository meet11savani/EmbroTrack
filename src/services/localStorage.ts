import type { EmbroideryRecord, Party, Quality, AppSettings, BackupData, Worker, WorkerTransaction } from '@/types';

const KEYS = {
  records: 'he_records',
  parties: 'he_parties',
  qualities: 'he_qualities',
  workers: 'he_workers',
  workerTransactions: 'he_worker_transactions',
  settings: 'he_settings',
  syncQueue: 'he_sync_queue',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  challanPrefix: 'HE',
  challanStartNumber: 1,
  challanPadding: 4,
  googleScriptUrl: '',
  adminScriptUrl: '',
  businessName: 'EmbroTrack',
  businessSubtitle: 'Embroidery Record Management',
  adminPhone: '',
  adminEmail: '',
  defaultUserRole: 'user',
  requireApproval: false,
  autoSyncOnStartup: false,
  enableDemoAccount: true,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  getRecords(): EmbroideryRecord[] {
    return safeParse<EmbroideryRecord[]>(localStorage.getItem(KEYS.records), []);
  },
  saveRecords(records: EmbroideryRecord[]): void {
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  },

  getParties(): Party[] {
    return safeParse<Party[]>(localStorage.getItem(KEYS.parties), []);
  },
  saveParties(parties: Party[]): void {
    localStorage.setItem(KEYS.parties, JSON.stringify(parties));
  },

  getQualities(): Quality[] {
    return safeParse<Quality[]>(localStorage.getItem(KEYS.qualities), []);
  },
  saveQualities(qualities: Quality[]): void {
    localStorage.setItem(KEYS.qualities, JSON.stringify(qualities));
  },

  getSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...safeParse<Partial<AppSettings>>(localStorage.getItem(KEYS.settings), {}) };
  },
  saveSettings(settings: AppSettings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  },

  getWorkers(): Worker[] {
    return safeParse<Worker[]>(localStorage.getItem(KEYS.workers), []);
  },
  saveWorkers(workers: Worker[]): void {
    localStorage.setItem(KEYS.workers, JSON.stringify(workers));
  },

  getWorkerTransactions(): WorkerTransaction[] {
    return safeParse<WorkerTransaction[]>(localStorage.getItem(KEYS.workerTransactions), []);
  },
  saveWorkerTransactions(transactions: WorkerTransaction[]): void {
    localStorage.setItem(KEYS.workerTransactions, JSON.stringify(transactions));
  },

  getSyncQueue(): SyncQueueItem[] {
    return safeParse<SyncQueueItem[]>(localStorage.getItem(KEYS.syncQueue), []);
  },
  saveSyncQueue(queue: SyncQueueItem[]): void {
    localStorage.setItem(KEYS.syncQueue, JSON.stringify(queue));
  },

  exportBackup(): BackupData {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      records: this.getRecords(),
      parties: this.getParties(),
      qualities: this.getQualities(),
      workers: this.getWorkers(),
      workerTransactions: this.getWorkerTransactions(),
      settings: this.getSettings(),
    };
  },

  clearAll(): void {
    localStorage.removeItem(KEYS.records);
    localStorage.removeItem(KEYS.parties);
    localStorage.removeItem(KEYS.qualities);
    localStorage.removeItem(KEYS.workers);
    localStorage.removeItem(KEYS.workerTransactions);
    localStorage.removeItem(KEYS.syncQueue);
  },
};

export interface SyncQueueItem {
  id: string;
  entityType: 'record' | 'party' | 'quality' | 'worker' | 'worker_transaction';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data: unknown;
  queuedAt: string;
  attempts: number;
}

export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.records) &&
    Array.isArray(d.parties) &&
    Array.isArray(d.qualities) &&
    typeof d.settings === 'object' &&
    typeof d.version === 'string'
  );
}
