import { useState, useRef, type FormEvent } from 'react';
import { Settings as SettingsIcon, RefreshCw, Download, Upload, Trash2, Link2, Hash, Save, Database, CloudUpload, ShieldCheck, UserCog, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UserManagement } from '@/pages/settings/UserManagement';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { validateBackup } from '@/services/localStorage';
import type { BackupData } from '@/types';

export function Settings() {
  const { settings, updateSettings, doSync, exportBackup, importBackup, clearLocalData, syncState, records, parties, qualities, workers, workerTransactions, showToast } = useApp();
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
  const [adminScriptUrl, setAdminScriptUrl] = useState(settings.adminScriptUrl);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessSubtitle, setBusinessSubtitle] = useState(settings.businessSubtitle);
  const [adminPhone, setAdminPhone] = useState(settings.adminPhone);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [defaultUserRole, setDefaultUserRole] = useState<'user' | 'admin'>(settings.defaultUserRole);
  const [requireApproval, setRequireApproval] = useState(settings.requireApproval);
  const [autoSyncOnStartup, setAutoSyncOnStartup] = useState(settings.autoSyncOnStartup);
  const [enableDemoAccount, setEnableDemoAccount] = useState(settings.enableDemoAccount);

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    updateSettings({
      challanPrefix: challanPrefix.trim() || 'HE',
      challanStartNumber: parseInt(challanStartNumber) || 1,
      challanPadding: Math.max(1, parseInt(challanPadding) || 4),
      googleScriptUrl: googleScriptUrl.trim(),
      adminScriptUrl: adminScriptUrl.trim(),
      businessName: businessName.trim() || 'EmbroTrack',
      businessSubtitle: businessSubtitle.trim() || 'Embroidery Record Management',
      adminPhone: adminPhone.trim(),
      adminEmail: adminEmail.trim(),
      defaultUserRole,
      requireApproval,
      autoSyncOnStartup,
      enableDemoAccount,
    });
    showToast('Settings saved', 'success');
  };

  const handleSync = async () => {
    setSyncing(true);
    await doSync();
    setSyncing(false);
  };

  const [savingToSheet, setSavingToSheet] = useState(false);

  const handleSaveToSheet = async () => {
    setSavingToSheet(true);
    await doSync();
    setSavingToSheet(false);
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
        setImportSummary(`${data.records.length} records, ${data.parties.length} parties, ${data.qualities.length} qualities, ${data.workers?.length ?? 0} workers`);
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

      {/* User Management (admin only) */}
      <UserManagement />

      {/* Admin Configuration */}
      <form onSubmit={handleSaveSettings} className="card p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-navy" />
          <h3 className="text-lg font-bold text-navy">Admin Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Admin Contact Phone</label>
            <input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="input-field" placeholder="98765 43210" />
          </div>
          <div>
            <label className="label-field">Admin Contact Email</label>
            <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="input-field" placeholder="admin@embrotrack.com" />
          </div>
        </div>

        <div>
          <label className="label-field">Default Role for New Users</label>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <button
              type="button"
              onClick={() => setDefaultUserRole('user')}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                defaultUserRole === 'user' ? 'border-teal bg-teal/10 text-teal' : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setDefaultUserRole('admin')}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                defaultUserRole === 'admin' ? 'border-navy bg-navy/10 text-navy' : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setRequireApproval((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-50"
          >
            <div className="flex items-center gap-3">
              <UserCog size={18} className="text-navy-300" />
              <div>
                <p className="text-sm font-semibold text-navy">Require Admin Approval for New Users</p>
                <p className="text-xs text-navy-300">Newly created accounts must be approved before they can sign in</p>
              </div>
            </div>
            {requireApproval ? <ToggleRight size={24} className="text-teal" /> : <ToggleLeft size={24} className="text-navy-200" />}
          </button>

          <button
            type="button"
            onClick={() => setAutoSyncOnStartup((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-50"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-navy-300" />
              <div>
                <p className="text-sm font-semibold text-navy">Auto-Sync on App Startup</p>
                <p className="text-xs text-navy-300">Automatically sync data with Google Sheets when the app launches</p>
              </div>
            </div>
            {autoSyncOnStartup ? <ToggleRight size={24} className="text-teal" /> : <ToggleLeft size={24} className="text-navy-200" />}
          </button>

          <button
            type="button"
            onClick={() => setEnableDemoAccount((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-50"
          >
            <div className="flex items-center gap-3">
              <ToggleLeft size={18} className="text-navy-300" />
              <div>
                <p className="text-sm font-semibold text-navy">Enable Demo Account</p>
                <p className="text-xs text-navy-300">Allow login with the demo account (demo / demo123)</p>
              </div>
            </div>
            {enableDemoAccount ? <ToggleRight size={24} className="text-teal" /> : <ToggleLeft size={24} className="text-navy-200" />}
          </button>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            <Save size={16} /> Save All Settings
          </button>
        </div>
      </form>

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
          <label className="label-field">Data Backend URL (Google Apps Script)</label>
          <input
            type="url"
            value={googleScriptUrl}
            onChange={(e) => setGoogleScriptUrl(e.target.value)}
            className="input-field"
            placeholder="https://script.google.com/macros/s/XXXXX/exec"
          />
          <p className="mt-1.5 text-xs text-navy-300">
            Paste the data backend Web App URL here. Handles records, parties, qualities, and workers.
          </p>
        </div>

        <div>
          <label className="label-field">Admin Backend URL (Google Apps Script)</label>
          <input
            type="url"
            value={adminScriptUrl}
            onChange={(e) => setAdminScriptUrl(e.target.value)}
            className="input-field"
            placeholder="https://script.google.com/macros/s/YYYYY/exec"
          />
          <p className="mt-1.5 text-xs text-navy-300">
            Paste the admin backend Web App URL here. Handles login and user account management.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { updateSettings({ googleScriptUrl: googleScriptUrl.trim(), adminScriptUrl: adminScriptUrl.trim() }); showToast('URLs saved', 'success'); }}
            className="btn-secondary"
          >
            <Save size={16} /> Save URLs
          </button>
          <button
            onClick={handleSync}
            disabled={!settings.googleScriptUrl || syncing}
            className="btn-primary disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleSaveToSheet}
            disabled={!settings.googleScriptUrl || savingToSheet}
            className="btn-primary disabled:opacity-50"
          >
            <CloudUpload size={16} className={savingToSheet ? 'animate-pulse' : ''} />
            {savingToSheet ? 'Saving...' : 'Save to Sheet'}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <div className="rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-2xl font-bold text-navy">{workers.filter((w) => !w.deleted).length}</p>
            <p className="text-xs text-navy-300 mt-1">Workers</p>
          </div>
          <div className="rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-2xl font-bold text-navy">{workerTransactions.filter((t) => !t.deleted).length}</p>
            <p className="text-xs text-navy-300 mt-1">Worker Txns</p>
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
          Export saves all records, parties, qualities, workers, and settings as a JSON file. Importing will replace all current data.
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
