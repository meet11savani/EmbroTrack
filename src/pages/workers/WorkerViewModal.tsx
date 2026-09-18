import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, Trash2, Plus, Wallet, TrendingDown, HandCoins, Eye } from 'lucide-react';
import type { Worker, WorkerTransaction, WorkerTransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { WorkerTransactionForm } from '@/pages/workers/WorkerTransactionForm';
import { WorkerTransactionViewModal } from '@/pages/workers/WorkerTransactionViewModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface WorkerViewModalProps {
  worker: Worker | null;
  transactions: WorkerTransaction[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: (data: { workerId: string; workerName: string; type: WorkerTransactionType; date: string; amount: number; description: string }) => void;
  onDeleteTransaction: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

const TYPE_CONFIG: Record<WorkerTransactionType, { label: string; icon: typeof Wallet; bg: string; text: string }> = {
  salary: { label: 'Salary', icon: Wallet, bg: 'bg-navy/10', text: 'text-navy' },
  withdrawal: { label: 'Withdrawal', icon: TrendingDown, bg: 'bg-danger/10', text: 'text-danger' },
  credit: { label: 'Credit', icon: HandCoins, bg: 'bg-success/10', text: 'text-success' },
};

export function WorkerViewModal({
  worker, transactions, onClose, onEdit, onDelete, onAddTransaction, onDeleteTransaction, showToast,
}: WorkerViewModalProps) {
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<WorkerTransaction | null>(null);
  const [viewingTxn, setViewingTxn] = useState<WorkerTransaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<WorkerTransaction | null>(null);

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
  }, [transactions, worker]);

  const summary = useMemo(() => {
    let totalSalary = 0, totalWithdrawal = 0, totalCredit = 0;
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

  const handleDeleteTxn = () => {
    if (!deletingTxn) return;
    onDeleteTransaction(deletingTxn.id);
    showToast('Transaction deleted', 'success');
    setDeletingTxn(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 no-print">
        <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
        <div className="animate-scale-in relative card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-navy px-6 py-5 flex items-center justify-between rounded-t-3xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
                <Wallet size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cream-100">{worker.name}</h2>
                <p className="text-xs text-navy-200">{worker.role || 'Worker Details'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="p-6 lg:p-8 space-y-5">
            {/* Worker info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Phone</p>
                <p className="mt-1 text-sm font-semibold text-navy">{worker.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Role</p>
                <p className="mt-1 text-sm font-semibold text-navy">{worker.role || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Transactions</p>
                <p className="mt-1 text-sm font-semibold text-navy">{workerTxns.length}</p>
              </div>
            </div>

            {worker.notes && (
              <>
                <div className="h-px bg-cream-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Notes</p>
                  <p className="mt-2 text-sm text-navy bg-cream-100 rounded-xl p-4">{worker.notes}</p>
                </div>
              </>
            )}

            <div className="h-px bg-cream-300" />

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Salary', value: formatCurrency(summary.totalSalary), color: 'text-navy' },
                { label: 'Withdrawal', value: formatCurrency(summary.totalWithdrawal), color: 'text-danger' },
                { label: 'Credit', value: formatCurrency(summary.totalCredit), color: 'text-success' },
                { label: 'Balance', value: formatCurrency(summary.balance), color: summary.balance >= 0 ? 'text-navy' : 'text-danger' },
              ].map((item) => (
                <div key={item.label} className="bg-cream-100 rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{item.label}</p>
                  <p className={`mt-1 text-base font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-cream-300" />

            {/* Transaction list */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy-300">Transaction History</h3>
              <button
                onClick={() => { setEditingTxn(null); setShowTxnForm(true); }}
                className="btn-primary text-xs py-2"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {workerTxns.length === 0 ? (
              <p className="text-sm text-navy-300 text-center py-6">No transactions yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {workerTxns.map((txn) => {
                  const config = TYPE_CONFIG[txn.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={txn.id}
                      onClick={() => setViewingTxn(txn)}
                      className="w-full flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-50"
                    >
                      <span className={`badge ${config.bg} ${config.text} shrink-0`}>
                        <Icon size={12} /> {config.label}
                      </span>
                      <span className="text-sm text-navy-300 whitespace-nowrap">{formatDate(txn.date)}</span>
                      <span className={`text-sm font-semibold ml-auto whitespace-nowrap ${config.text}`}>
                        {formatCurrency(txn.amount)}
                      </span>
                      <Eye size={14} className="text-navy-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-cream-300 px-6 py-4 flex items-center gap-3 rounded-b-3xl">
            <button onClick={onDelete} className="btn-danger">
              <Trash2 size={16} /> Delete
            </button>
            <button onClick={onEdit} className="btn-primary ml-auto">
              <Pencil size={16} /> Edit
            </button>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Nested modals */}
      <WorkerTransactionViewModal
        transaction={viewingTxn}
        workerName={worker.name}
        onClose={() => setViewingTxn(null)}
        onEdit={() => { setEditingTxn(viewingTxn); setViewingTxn(null); setShowTxnForm(true); }}
        onDelete={() => { setDeletingTxn(viewingTxn); setViewingTxn(null); }}
      />

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
    </>
  );
}
