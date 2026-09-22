/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { EmbroideryRecord, Party, Quality, AppSettings, SyncStatus, Worker, WorkerTransaction } from '@/types';
import { storage } from '@/services/localStorage';
import { addToSyncQueue, syncNow, getPendingCount, type SyncState } from '@/services/syncService';
import { generateId, nowISO } from '@/utils/formatters';
import { calculateAmount, determineStatus } from '@/utils/calculations';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextValue {
  records: EmbroideryRecord[];
  parties: Party[];
  qualities: Quality[];
  workers: Worker[];
  workerTransactions: WorkerTransaction[];
  settings: AppSettings;
  syncState: SyncState;
  toasts: Toast[];

  addRecord: (data: Omit<EmbroideryRecord, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'status' | 'amount'>) => EmbroideryRecord;
  updateRecord: (id: string, data: Partial<EmbroideryRecord>) => void;
  deleteRecord: (id: string) => void;

  addParty: (data: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Party;
  updateParty: (id: string, data: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  addQuality: (data: Omit<Quality, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Quality;
  updateQuality: (id: string, data: Partial<Quality>) => void;
  deleteQuality: (id: string) => void;

  addWorker: (data: Omit<Worker, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Worker;
  updateWorker: (id: string, data: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  addWorkerTransaction: (data: Omit<WorkerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => WorkerTransaction;
  updateWorkerTransaction: (id: string, data: Partial<WorkerTransaction>) => void;
  deleteWorkerTransaction: (id: string) => void;

  updateSettings: (data: Partial<AppSettings>) => void;

  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;

  doSync: () => Promise<void>;

  exportBackup: () => void;
  importBackup: (data: unknown) => boolean;
  clearLocalData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const DEFAULT_SYNC_STATE: SyncState = {
  status: 'local',
  pendingCount: 0,
  lastSync: null,
  error: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<EmbroideryRecord[]>(() => storage.getRecords());
  const [parties, setParties] = useState<Party[]>(() => storage.getParties());
  const [qualities, setQualities] = useState<Quality[]>(() => storage.getQualities());
  const [workers, setWorkers] = useState<Worker[]>(() => storage.getWorkers());
  const [workerTransactions, setWorkerTransactions] = useState<WorkerTransaction[]>(() => storage.getWorkerTransactions());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [syncState, setSyncState] = useState<SyncState>(DEFAULT_SYNC_STATE);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist to localStorage on change
  useEffect(() => { storage.saveRecords(records); }, [records]);
  useEffect(() => { storage.saveParties(parties); }, [parties]);
  useEffect(() => { storage.saveQualities(qualities); }, [qualities]);
  useEffect(() => { storage.saveWorkers(workers); }, [workers]);
  useEffect(() => { storage.saveWorkerTransactions(workerTransactions); }, [workerTransactions]);
  useEffect(() => { storage.saveSettings(settings); }, [settings]);

  // Update sync state based on pending count
  useEffect(() => {
    const pending = getPendingCount();
    setSyncState((prev) => {
      if (!settings.googleScriptUrl) {
        return { ...prev, status: 'local', pendingCount: pending };
      }
      if (prev.status === 'syncing') return { ...prev, pendingCount: pending };
      if (pending > 0) return { ...prev, status: 'pending', pendingCount: pending };
      if (prev.status === 'error') return { ...prev, pendingCount: pending };
      return { ...prev, status: 'synced', pendingCount: 0 };
    });
  }, [records, parties, qualities, workers, workerTransactions, settings.googleScriptUrl]);

  // Online/offline auto-sync
  useEffect(() => {
    const handleOnline = () => {
      if (settings.googleScriptUrl && getPendingCount() > 0) {
        doSync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [settings.googleScriptUrl]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addRecord: AppContextValue['addRecord'] = useCallback((data) => {
    const now = nowISO();
    const amount = calculateAmount(data.quantity, data.rate);
    const status = determineStatus({ creditDate: data.creditDate, debitDate: data.debitDate, amount });
    const newRecord: EmbroideryRecord = {
      ...data,
      id: generateId(),
      amount,
      status,
      createdAt: now,
      updatedAt: now,
      syncStatus: settings.googleScriptUrl ? 'pending' : 'local',
    };
    setRecords((prev) => [...prev, newRecord]);
    if (settings.googleScriptUrl) {
      addToSyncQueue('record', 'create', newRecord.id, newRecord);
    }
    return newRecord;
  }, [settings.googleScriptUrl]);

  const updateRecord: AppContextValue['updateRecord'] = useCallback((id, data) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...data, updatedAt: nowISO() };
        merged.amount = calculateAmount(merged.quantity, merged.rate);
        merged.status = determineStatus(merged);
        merged.syncStatus = settings.googleScriptUrl ? 'pending' : 'local' as SyncStatus;
        if (settings.googleScriptUrl) {
          addToSyncQueue('record', 'update', id, merged);
        }
        return merged;
      })
    );
  }, [settings.googleScriptUrl]);

  const deleteRecord: AppContextValue['deleteRecord'] = useCallback((id) => {
    setRecords((prev) => prev.map((r) =>
      r.id === id ? { ...r, deleted: true, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus } : r
    ));
    if (settings.googleScriptUrl) {
      addToSyncQueue('record', 'delete', id, { id });
    }
  }, [settings.googleScriptUrl]);

  const addParty: AppContextValue['addParty'] = useCallback((data) => {
    const now = nowISO();
    const newParty: Party = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: settings.googleScriptUrl ? 'pending' : 'local',
    };
    setParties((prev) => [...prev, newParty]);
    if (settings.googleScriptUrl) {
      addToSyncQueue('party', 'create', newParty.id, newParty);
    }
    return newParty;
  }, [settings.googleScriptUrl]);

  const updateParty: AppContextValue['updateParty'] = useCallback((id, data) => {
    setParties((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...data, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus };
      if (settings.googleScriptUrl) addToSyncQueue('party', 'update', id, merged);
      return merged;
    }));
    // Also update partyName in records
    if (data.name) {
      setRecords((prev) => prev.map((r) =>
        r.partyId === id ? { ...r, partyName: data.name!, updatedAt: nowISO() } : r
      ));
    }
  }, [settings.googleScriptUrl]);

  const deleteParty: AppContextValue['deleteParty'] = useCallback((id) => {
    setParties((prev) => prev.map((p) =>
      p.id === id ? { ...p, deleted: true, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus } : p
    ));
    if (settings.googleScriptUrl) {
      addToSyncQueue('party', 'delete', id, { id });
    }
  }, [settings.googleScriptUrl]);

  const addQuality: AppContextValue['addQuality'] = useCallback((data) => {
    const now = nowISO();
    const newQuality: Quality = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: settings.googleScriptUrl ? 'pending' : 'local',
    };
    setQualities((prev) => [...prev, newQuality]);
    if (settings.googleScriptUrl) {
      addToSyncQueue('quality', 'create', newQuality.id, newQuality);
    }
    return newQuality;
  }, [settings.googleScriptUrl]);

  const updateQuality: AppContextValue['updateQuality'] = useCallback((id, data) => {
    setQualities((prev) => prev.map((q) => {
      if (q.id !== id) return q;
      const merged = { ...q, ...data, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus };
      if (settings.googleScriptUrl) addToSyncQueue('quality', 'update', id, merged);
      return merged;
    }));
    if (data.name) {
      setRecords((prev) => prev.map((r) =>
        r.qualityId === id ? { ...r, qualityName: data.name!, updatedAt: nowISO() } : r
      ));
    }
  }, [settings.googleScriptUrl]);

  const deleteQuality: AppContextValue['deleteQuality'] = useCallback((id) => {
    setQualities((prev) => prev.map((q) =>
      q.id === id ? { ...q, deleted: true, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus } : q
    ));
    if (settings.googleScriptUrl) {
      addToSyncQueue('quality', 'delete', id, { id });
    }
  }, [settings.googleScriptUrl]);

  const addWorker: AppContextValue['addWorker'] = useCallback((data) => {
    const now = nowISO();
    const newWorker: Worker = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: settings.googleScriptUrl ? 'pending' : 'local',
    };
    setWorkers((prev) => [...prev, newWorker]);
    if (settings.googleScriptUrl) {
      addToSyncQueue('worker', 'create', newWorker.id, newWorker);
    }
    return newWorker;
  }, [settings.googleScriptUrl]);

  const updateWorker: AppContextValue['updateWorker'] = useCallback((id, data) => {
    setWorkers((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      const merged = { ...w, ...data, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus };
      if (settings.googleScriptUrl) addToSyncQueue('worker', 'update', id, merged);
      return merged;
    }));
    if (data.name) {
      setWorkerTransactions((prev) => prev.map((t) =>
        t.workerId === id ? { ...t, workerName: data.name!, updatedAt: nowISO() } : t
      ));
    }
  }, [settings.googleScriptUrl]);

  const deleteWorker: AppContextValue['deleteWorker'] = useCallback((id) => {
    setWorkers((prev) => prev.map((w) =>
      w.id === id ? { ...w, deleted: true, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus } : w
    ));
    if (settings.googleScriptUrl) {
      addToSyncQueue('worker', 'delete', id, { id });
    }
  }, [settings.googleScriptUrl]);

  const addWorkerTransaction: AppContextValue['addWorkerTransaction'] = useCallback((data) => {
    const now = nowISO();
    const newTxn: WorkerTransaction = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: settings.googleScriptUrl ? 'pending' : 'local',
    };
    setWorkerTransactions((prev) => [...prev, newTxn]);
    if (settings.googleScriptUrl) {
      addToSyncQueue('worker_transaction', 'create', newTxn.id, newTxn);
    }
    return newTxn;
  }, [settings.googleScriptUrl]);

  const updateWorkerTransaction: AppContextValue['updateWorkerTransaction'] = useCallback((id, data) => {
    setWorkerTransactions((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const merged = { ...t, ...data, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus };
      if (settings.googleScriptUrl) addToSyncQueue('worker_transaction', 'update', id, merged);
      return merged;
    }));
  }, [settings.googleScriptUrl]);

  const deleteWorkerTransaction: AppContextValue['deleteWorkerTransaction'] = useCallback((id) => {
    setWorkerTransactions((prev) => prev.map((t) =>
      t.id === id ? { ...t, deleted: true, updatedAt: nowISO(), syncStatus: settings.googleScriptUrl ? 'pending' as SyncStatus : 'local' as SyncStatus } : t
    ));
    if (settings.googleScriptUrl) {
      addToSyncQueue('worker_transaction', 'delete', id, { id });
    }
  }, [settings.googleScriptUrl]);

  const updateSettings: AppContextValue['updateSettings'] = useCallback((data) => {
    setSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const doSync = useCallback(async () => {
    if (!settings.googleScriptUrl) {
      showToast('Google Sheets URL not configured', 'warning');
      return;
    }
    setSyncState((prev) => ({ ...prev, status: 'syncing', error: null }));
    try {
      const result = await syncNow(settings.googleScriptUrl, records, parties, qualities);
      if (result.success) {
        setRecords((prev) => prev.map((r) => ({ ...r, syncStatus: 'synced' as SyncStatus })));
        setParties((prev) => prev.map((p) => ({ ...p, syncStatus: 'synced' as SyncStatus })));
        setQualities((prev) => prev.map((q) => ({ ...q, syncStatus: 'synced' as SyncStatus })));
        setSyncState({ status: 'synced', pendingCount: 0, lastSync: nowISO(), error: null });
        showToast('All data synced successfully', 'success');
      } else {
        setSyncState((prev) => ({ ...prev, status: 'error', error: result.error ?? 'Unknown error' }));
        showToast('Sync failed: ' + (result.error ?? 'Unknown error'), 'error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncState((prev) => ({ ...prev, status: 'error', error: message }));
      showToast('Sync failed: ' + message, 'error');
    }
  }, [settings.googleScriptUrl, records, parties, qualities, showToast]);

  const exportBackup = useCallback(() => {
    const data = storage.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `embrotrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  }, [showToast]);

  const importBackup = useCallback((data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.records) || !Array.isArray(d.parties) || !Array.isArray(d.qualities)) {
      return false;
    }
    setRecords(d.records as EmbroideryRecord[]);
    setParties(d.parties as Party[]);
    setQualities(d.qualities as Quality[]);
    setWorkers(Array.isArray(d.workers) ? d.workers as Worker[] : []);
    setWorkerTransactions(Array.isArray(d.workerTransactions) ? d.workerTransactions as WorkerTransaction[] : []);
    if (d.settings && typeof d.settings === 'object') {
      setSettings((prev) => ({ ...prev, ...(d.settings as Partial<AppSettings>) }));
    }
    showToast('Data imported successfully', 'success');
    return true;
  }, [showToast]);

  const clearLocalData = useCallback(() => {
    storage.clearAll();
    setRecords([]);
    setParties([]);
    setQualities([]);
    setWorkers([]);
    setWorkerTransactions([]);
    setSyncState(DEFAULT_SYNC_STATE);
    showToast('Local data cleared', 'success');
  }, [showToast]);

  const value: AppContextValue = {
    records, parties, qualities, workers, workerTransactions, settings, syncState, toasts,
    addRecord, updateRecord, deleteRecord,
    addParty, updateParty, deleteParty,
    addQuality, updateQuality, deleteQuality,
    addWorker, updateWorker, deleteWorker,
    addWorkerTransaction, updateWorkerTransaction, deleteWorkerTransaction,
    updateSettings, showToast, dismissToast,
    doSync, exportBackup, importBackup, clearLocalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
