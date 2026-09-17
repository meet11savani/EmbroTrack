export type SyncStatus = 'pending' | 'synced' | 'error' | 'local';

export type RecordStatus = 'Pending' | 'Partially Settled' | 'Settled';

export interface EmbroideryRecord {
  id: string;
  challanNumber: string;
  partyId: string;
  partyName: string;
  date: string;
  qualityId: string;
  qualityName: string;
  designNumber: string;
  quantity: number;
  rate: number;
  amount: number;
  creditDate: string | null;
  debitDate: string | null;
  notes: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted?: boolean;
}

export interface Party {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted?: boolean;
}

export interface Quality {
  id: string;
  name: string;
  designNumber: string;
  defaultRate: number;
  unit: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted?: boolean;
}

export interface AppSettings {
  challanPrefix: string;
  challanStartNumber: number;
  challanPadding: number;
  googleScriptUrl: string;
  businessName: string;
  businessSubtitle: string;
}

export type EntityType = 'records' | 'parties' | 'qualities';

export type WorkerTransactionType = 'salary' | 'withdrawal' | 'credit';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted?: boolean;
}

export interface WorkerTransaction {
  id: string;
  workerId: string;
  workerName: string;
  type: WorkerTransactionType;
  date: string;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted?: boolean;
}

export interface WorkerSummary {
  totalSalary: number;
  totalWithdrawal: number;
  totalCredit: number;
  balance: number;
  transactionCount: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  records: EmbroideryRecord[];
  parties: Party[];
  qualities: Quality[];
  workers: Worker[];
  workerTransactions: WorkerTransaction[];
  settings: AppSettings;
}

export interface PartySummary {
  totalRecords: number;
  totalQuantity: number;
  totalAmount: number;
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export interface QualitySummary {
  totalQuantity: number;
  totalRecords: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: keyof EmbroideryRecord | string;
  direction: SortDirection;
}

export interface FilterState {
  partyId: string;
  qualityId: string;
  dateFrom: string;
  dateTo: string;
  status: RecordStatus | '';
}
