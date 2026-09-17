import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { X, ArrowLeft, Plus, Trash2, Wallet, TrendingDown, HandCoins } from 'lucide-react';
import type { Worker, WorkerTransaction, WorkerTransactionType } from '@/types';
import { formatCurrency, formatDate, todayISO } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface WorkerDetailsProps {
  worker: Worker | null;
  transactions: WorkerTransaction[];
  onClose: () => void;
}

interface TxnFormData {
  type: WorkerTransactionType;
  date: string;
  amount: string;
  description: string;
}

const TYPE_CONFIG: Record<WorkerTransactionType, { label: string; icon: typeof Wallet; color: string; bg: string; text: string }> = {
  salary: { label: 'Salary', icon: Wallet, color: 'text-navy', bg: 'bg-navy/10', text: 'text-navy' },
  withdrawal: { label: 'Withdrawal', icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10', text: 'text-danger' },
  credit: { label: 'Credit', icon: HandCoins, color: 'text-success', bg: 'bg-success/10', text: 'text-success' },
};

export function WorkerDetails({ worker, transactions, onClose }: WorkerDetailsProps) {
  const { addWorkerTransaction, deleteWorkerTransaction, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [deletingTxn, setDeletingTxn] = useState<WorkerTransaction | null>(null);
  const [formData, setFormData] = useState<TxnFormData>({
    type: 'salary',
    date: todayISO(),
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const workerTxns = useMemo(() => {
    if (!worker) return [];
    return transactions
      .filter((t) => t.workerId === worker.id && !t.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [worker, transactions]);

  const summary = useMemo(() => {
    let totalSalary = 0;
    let totalWithdrawal = 0;
    let totalCredit = 0;
    for (const t of workerTxns) {
      if (t.type === 'salary') totalSalary += t.amount;
      else if (t.type === 'withdrawal') totalWithdrawal += t.amount;
      else if (t.type === 'credit') totalCredit += t.amount;
    }
    return {
      totalSalary: Math.round(totalSalary * 100) / 100,
      totalWithdrawal: Math.round(totalWithdrawal * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balance: Math.round((totalSalary + totalCredit - totalWithdrawal) * 100) / 100,
    };
  }, [workerTxns]);

  if (!worker) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      errs.amount = 'Amount is required';
    } else if (amount <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) {
      errs.date = 'Date is required';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    addWorkerTransaction({
      workerId: worker.id,
      workerName: worker.name,
      type: formData.type,
      date: formData.date,
      amount,
      description: formData.description.trim(),
    });
    showToast('Transaction added', 'success');
    setFormData({ type: 'salary', date: todayISO(), amount: '', description: '' });
    setErrors({});
    setShowForm(false);
  };

  const handleDeleteTxn = () => {
    if (!deletingTxn) return;
    deleteWorkerTransaction(deletingTxn.id);
    showToast('Transaction deleted', 'success');
    setDeletingTxn(null);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-cream overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-navy px-6 py-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-cream-100 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cream-100">{worker.name}</h2>
            <p className="text-xs text-navy-200">{worker.role || 'Worker Details'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
          <X size={22} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Worker info card */}
        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Worker Name</p>
              <p className="mt-1 text-lg font-bold text-navy">{worker.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Phone</p>
              <p className="mt-1 text-base font-semibold text-navy">{worker.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Role</p>
              <p className="mt-1 text-base font-semibold text-navy">{worker.role || '—'}</p>
            </div>
          </div>
          {worker.notes && (
            <div className="mt-4 pt-4 border-t border-cream-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Notes</p>
              <p className="mt-1 text-sm text-navy">{worker.notes}</p>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Salary', value: formatCurrency(summary.totalSalary), color: 'text-navy' },
            { label: 'Total Withdrawal', value: formatCurrency(summary.totalWithdrawal), color: 'text-danger' },
            { label: 'Total Credit', value: formatCurrency(summary.totalCredit), color: 'text-success' },
            { label: 'Balance', value: formatCurrency(summary.balance), color: summary.balance >= 0 ? 'text-navy' : 'text-danger' },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{item.label}</p>
              <p className={`mt-1 text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-bold text-navy">Transaction History</h3>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={16} /> ADD TRANSACTION
            </button>
          </div>

          {showForm && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-navy">New Transaction</h4>
                <button onClick={() => { setShowForm(false); setErrors({}); }} className="text-navy-300 hover:text-navy">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label-field">Type <span className="text-danger">*</span></label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkerTransactionType })}
                      className="input-field"
                    >
                      <option value="salary">Salary</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`input-field ${errors.date ? 'border-danger' : ''}`}
                    />
                    {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="label-field">Amount <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`input-field ${errors.amount ? 'border-danger' : ''}`}
                      placeholder="500"
                    />
                    {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount}</p>}
                  </div>
                </div>
                <div>
                  <label className="label-field">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    placeholder="Monthly salary, cash withdrawal, advance credit..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <Plus size={16} /> Add Transaction
                  </button>
                </div>
              </form>
            </div>
          )}

          {workerTxns.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-navy-300">No transactions found for this worker.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream-100 border-b border-cream-300">
                      <th className="px-4 py-3.5 text-left whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">Type</span>
                      </th>
                      <th className="px-4 py-3.5 text-left whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">Date</span>
                      </th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">Amount</span>
                      </th>
                      <th className="px-4 py-3.5 text-left whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">Description</span>
                      </th>
                      <th className="px-4 py-3.5 text-left whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy-300">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerTxns.map((txn, index) => {
                      const config = TYPE_CONFIG[txn.type];
                      const Icon = config.icon;
                      return (
                        <tr
                          key={txn.id}
                          className={`border-b border-cream-200 hover:bg-cream-50 transition-colors ${
                            index % 2 === 1 ? 'bg-cream-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`badge ${config.bg} ${config.text}`}>
                              <Icon size={12} /> {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{formatDate(txn.date)}</td>
                          <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${config.text}`}>
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-4 py-3 text-navy-300 max-w-[260px] truncate whitespace-nowrap">{txn.description || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => setDeletingTxn(txn)}
                              className="w-7 h-7 rounded-lg border border-danger/20 bg-danger/5 flex items-center justify-center text-danger transition-colors hover:bg-danger hover:text-white"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deletingTxn}
        title="Delete this transaction?"
        message={`This ${deletingTxn?.type} transaction of ${formatCurrency(deletingTxn?.amount ?? 0)} will be removed.`}
        confirmLabel="Delete Transaction"
        onConfirm={handleDeleteTxn}
        onCancel={() => setDeletingTxn(null)}
      />
    </div>
  );
}
