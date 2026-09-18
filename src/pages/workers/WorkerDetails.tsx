import { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeft, Plus, Trash2, Wallet, TrendingDown, HandCoins, Pencil, Eye } from 'lucide-react';
import type { WorkerTransaction, WorkerTransactionType } from '@/types';
import { formatCurrency, formatDate, todayISO } from '@/utils/formatters';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { WorkerTransactionViewModal } from '@/pages/workers/WorkerTransactionViewModal';
import { WorkerTransactionForm } from '@/pages/workers/WorkerTransactionForm';

interface WorkerDetailsProps {
  workerId: string;
  onClose: () => void;
  onEdit: () => void;
}

const TYPE_CONFIG: Record<WorkerTransactionType, { label: string; icon: typeof Wallet; bg: string; text: string }> = {
  salary: { label: 'Salary', icon: Wallet, bg: 'bg-navy/10', text: 'text-navy' },
  withdrawal: { label: 'Withdrawal', icon: TrendingDown, bg: 'bg-danger/10', text: 'text-danger' },
  credit: { label: 'Credit', icon: HandCoins, bg: 'bg-success/10', text: 'text-success' },
};

export function WorkerDetails({ workerId, onClose, onEdit }: WorkerDetailsProps) {
  const { workers, workerTransactions, deleteWorkerTransaction, showToast } = useApp();
  const [viewingTxn, setViewingTxn] = useState<WorkerTransaction | null>(null);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<WorkerTransaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<WorkerTransaction | null>(null);

  const worker = useMemo(
    () => workers.find((w) => w.id === workerId && !w.deleted) ?? null,
    [workers, workerId]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const workerTxns = useMemo(() => {
    return workerTransactions
      .filter((t) => t.workerId === workerId && !t.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workerTransactions, workerId]);

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

  if (!worker) {
    return (
      <div className="fixed inset-0 z-[70] bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-navy-300 mb-4">Worker not found</p>
          <button onClick={onClose} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const handleDeleteTxn = () => {
    if (!deletingTxn) return;
    deleteWorkerTransaction(deletingTxn.id);
    showToast('Transaction deleted', 'success');
    setDeletingTxn(null);
  };

  const handleEditTxn = () => {
    setEditingTxn(viewingTxn);
    setViewingTxn(null);
    setShowTxnForm(true);
  };

  const handleDeleteFromView = () => {
    setDeletingTxn(viewingTxn);
    setViewingTxn(null);
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
        <div className="flex items-center gap-3">
          <button onClick={onEdit} className="btn-secondary text-xs py-2">
            <Pencil size={14} /> Edit Worker
          </button>
          <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>
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
            <button
              onClick={() => { setEditingTxn(null); setShowTxnForm(true); }}
              className="btn-primary"
            >
              <Plus size={16} /> ADD TRANSACTION
            </button>
          </div>

          {workerTxns.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-3">
                <Wallet size={24} className="text-navy-300" />
              </div>
              <p className="text-navy-300">No transactions found for this worker.</p>
              <button
                onClick={() => { setEditingTxn(null); setShowTxnForm(true); }}
                className="btn-primary mt-4"
              >
                <Plus size={16} /> ADD TRANSACTION
              </button>
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
                          className={`border-b border-cream-200 hover:bg-cream-50 transition-colors cursor-pointer ${
                            index % 2 === 1 ? 'bg-cream-50/50' : ''
                          }`}
                          onClick={() => setViewingTxn(txn)}
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
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setViewingTxn(txn)}
                                className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-navy-200"
                                title="View"
                                aria-label="View"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => { setEditingTxn(txn); setShowTxnForm(true); }}
                                className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingTxn(txn)}
                                className="w-7 h-7 rounded-lg border border-danger/20 bg-danger/5 flex items-center justify-center text-danger transition-colors hover:bg-danger hover:text-white"
                                title="Delete"
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

      {/* Transaction view popup */}
      <WorkerTransactionViewModal
        transaction={viewingTxn}
        workerName={worker.name}
        onClose={() => setViewingTxn(null)}
        onEdit={handleEditTxn}
        onDelete={handleDeleteFromView}
      />

      {/* Transaction form */}
      {showTxnForm && (
        <WorkerTransactionForm
          workerId={worker.id}
          workerName={worker.name}
          editingTxn={editingTxn}
          onClose={() => { setShowTxnForm(false); setEditingTxn(null); }}
          onSaved={() => showToast(editingTxn ? 'Transaction updated' : 'Transaction added', 'success')}
        />
      )}

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
