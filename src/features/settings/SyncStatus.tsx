import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useState, useRef, useEffect } from 'react';

export function SyncStatus() {
  const { syncState, doSync, settings } = useApp();
  const [showInfo, setShowInfo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowInfo(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const config = {
    local: { icon: CloudOff, label: 'LOCAL', color: 'text-navy-300', dot: 'bg-navy-300' },
    synced: { icon: Check, label: 'SYNCED', color: 'text-success', dot: 'bg-success' },
    syncing: { icon: RefreshCw, label: 'SYNCING...', color: 'text-info', dot: 'bg-info', spin: true },
    pending: { icon: Cloud, label: `${syncState.pendingCount} PENDING`, color: 'text-warning', dot: 'bg-warning' },
    error: { icon: AlertCircle, label: 'ERROR', color: 'text-danger', dot: 'bg-danger' },
  };

  const current = config[syncState.status];
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-cream-200 transition-colors"
        title="Sync status"
      >
        <span className={`w-2 h-2 rounded-full ${current.dot} ${syncState.status === 'syncing' ? 'animate-pulse' : ''}`} />
        <Icon size={14} className={`${current.color} ${current.spin ? 'animate-spin' : ''}`} />
        <span className={`text-xs font-semibold ${current.color}`}>{current.label}</span>
      </button>

      {showInfo && (
        <div className="animate-fade-in absolute right-0 top-full mt-2 w-72 card p-4 z-50">
          <h4 className="text-sm font-bold text-navy mb-3">Sync Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-navy-300">Google Sheets</span>
              <span className={settings.googleScriptUrl ? 'text-success font-medium' : 'text-navy-300'}>
                {settings.googleScriptUrl ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-300">Pending items</span>
              <span className="text-navy font-medium">{syncState.pendingCount}</span>
            </div>
            {syncState.lastSync && (
              <div className="flex justify-between">
                <span className="text-navy-300">Last sync</span>
                <span className="text-navy font-medium">
                  {new Date(syncState.lastSync).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {syncState.error && (
              <div className="mt-2 p-2 rounded-lg bg-danger/10 text-danger text-xs">
                {syncState.error}
              </div>
            )}
          </div>
          {settings.googleScriptUrl && (
            <button
              onClick={() => { doSync(); setShowInfo(false); }}
              disabled={syncState.status === 'syncing'}
              className="btn-primary w-full mt-4 text-xs py-2"
            >
              <RefreshCw size={14} className={syncState.status === 'syncing' ? 'animate-spin' : ''} />
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
