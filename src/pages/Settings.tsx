import { useState, useRef, type FormEvent } from 'react';
import { Settings as SettingsIcon, RefreshCw, Download, Upload, Trash2, Link2, Hash, Save, Database } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { validateBackup } from '@/services/localStorage';
import type { BackupData } from '@/types';

export function Settings() {
  const { settings, updateSettings, doSync, exportBackup, importBackup, clearLocalData, syncState, records, parties, qualities, showToast } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [importSummary, setImportSummary] = useState('');
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Local form state for settings
  const [challanPrefix, setChallanPrefix] = useState(settings.challanPrefix);
  const [challanStartNumber, setChallanStartNumber] = useState(String(settings.challanStartNumber));
  const [challanPadding, setChallanPadding] = useState(String(settings.challanPadding));
  const [googleScriptUrl, setGoogleScriptUrl] = useState(settings.googleScriptUrl);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessSubtitle, setBusinessSubtitle] = useState(settings.businessSubtitle);

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    updateSettings({
      challanPrefix: challanPrefix.trim() || 'HE',
      challanStartNumber: parseInt(challanStartNumber) || 1,
      challanPadding: Math.max(1, parseInt(challanPadding) || 4),
      googleScriptUrl: googleScriptUrl.trim(),
      businessName: businessName.trim() || 'EmbroTrack',
      businessSubtitle: businessSubtitle.trim() || 'Embroidery Record Management',
    });
    showToast('Settings saved', 'success');
  };

  const handleSync = async () => {
    setSyncing(true);
    await doSync();
    setSyncing(false);
  };

  const handleExport = () => {
    exportBackup();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!validateBackup(data)) {
          showToast('Invalid backup file format', 'error');
          return;
        }
        setPendingImport(data);
        setImportSummary(`${data.records.length} records, ${data.parties.length} parties, ${data.qualities.length} qualities`);
        setShowImportConfirm(true);
      } catch {
        showToast('Failed to read backup file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = () => {
    if (!pendingImport) return;
    const success = importBackup(pendingImport);
    if (success) {
      setShowImportConfirm(false);
      setPendingImport(null);
    } else {
      showToast('Import failed', 'error');
    }
  };

  const handleClearData = () => {
    clearLocalData();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
          <SettingsIcon size={20} className="text-cream-100" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy">Settings</h2>
          <p className="text-sm text-navy-300">Configure your application</p>
        </div>
      </div>

      {/* Business & Challan Settings */}
      <form onSubmit={handleSaveSettings} className="card p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-navy" />
          <h3 className="text-lg font-bold text-navy">Business & Challan Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Business Subtitle</label>
            <input type="text" value={businessSubtitle} onChange={(e) => setBusinessSubtitle(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Challan Prefix</label>
            <input type="text" value={challanPrefix} onChange={(e) => setChallanPrefix(e.target.value)} className="input-field" placeholder="HE" />
          </div>
          <div>
            <label className="label-field">Starting Number</label>
            <input type="number" min="1" value={challanStartNumber} onChange={(e) => setChallanStartNumber(e.target.value)} className="input-field" placeholder="1" />
          </div>
          <div>
            <label className="label-field">Number Padding</label>
            <input type="number" min="1" max="8" value={challanPadding} onChange={(e) => setChallanPadding(e.target.value)} className="input-field" placeholder="4" />
            <p className="mt-1 text-xs text-navy-300">e.g. padding 4 = HE-0001</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            <Save size={16} /> Save Settings
          </button>
        </div>
      </form>

      {/* Google Sheets Sync */}
      <div className="card p-6 lg:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-navy" />
          <h3 className="text-lg font-bold text-navy">Google Sheets Sync</h3>
        </div>

        <div>
          <label className="label-field">Google Apps Script Web App URL</label>
          <input
            type="url"
            value={googleScriptUrl}
            onChange={(e) => setGoogleScriptUrl(e.target.value)}
            className="input-field"
            placeholder="https://script.google.com/macros/s/XXXXX/exec"
          />
          <p className="mt-1.5 text-xs text-navy-300">
            Paste your Google Apps Script Web App URL here. The app works offline without this.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { updateSettings({ googleScriptUrl: googleScriptUrl.trim() }); showToast('URL saved', 'success'); }}
            className="btn-secondary"
          >
            <Save size={16} /> Save URL
          </button>
          <button
            onClick={handleSync}
            disabled={!settings.googleScriptUrl || syncing}
            className="btn-primary disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Sync status */}
        <div className="rounded-xl bg-cream-100 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-300">Sync Status</span>
            <span className="font-semibold text-navy capitalize">{syncState.status}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-300">Pending Items</span>
            <span className="font-semibold text-navy">{syncState.pendingCount}</span>
          </div>
          {syncState.lastSync && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy-300">Last Sync</span>
              <span className="font-semibold text-navy">{new Date(syncState.lastSync).toLocaleString('en-IN')}</span>
            </div>
          )}
          {syncState.error && (
            <div className="text-xs text-danger bg-danger/5 rounded-lg p-2 mt-2">{syncState.error}</div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 lg:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-navy" />
          <h3 className="text-lg font-bold text-navy">Data Management</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-2xl font-bold text-navy">{records.filter((r) => !r.deleted).length}</p>
            <p className="text-xs text-navy-300 mt-1">Records</p>
          </div>
          <div className="rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-2xl font-bold text-navy">{parties.filter((p) => !p.deleted).length}</p>
            <p className="text-xs text-navy-300 mt-1">Parties</p>
          </div>
          <div className="rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-2xl font-bold text-navy">{qualities.filter((q) => !q.deleted).length}</p>
            <p className="text-xs text-navy-300 mt-1">Qualities</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleExport} className="btn-secondary">
            <Download size={16} /> Export Backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary">
            <Upload size={16} /> Import Backup
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => setShowClearConfirm(true)} className="btn-danger ml-auto">
            <Trash2 size={16} /> Clear Local Data
          </button>
        </div>

        <p className="text-xs text-navy-300">
          Export saves all records, parties, qualities, and settings as a JSON file. Importing will replace all current data.
          Clearing local data does not affect Google Sheets.
        </p>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Clear Local Data?"
        message="This will permanently remove all local data from this browser. This cannot be undone. Google Sheets data will not be affected."
        confirmLabel="Clear All Data"
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        open={showImportConfirm}
        title="Import Backup?"
        message={`This will replace all current data with: ${importSummary}. Continue?`}
        confirmLabel="Import"
        onConfirm={handleImport}
        onCancel={() => { setShowImportConfirm(false); setPendingImport(null); }}
        danger={false}
      />
    </div>
  );
}
