import { useEffect } from 'react';
import { X, Pencil, Trash2, Wallet, TrendingDown, HandCoins } from 'lucide-react';
import type { WorkerTransaction, WorkerTransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface WorkerTransactionViewModalProps {
  transaction: WorkerTransaction | null;
  workerName: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_CONFIG: Record<WorkerTransactionType, { label: string; icon: typeof Wallet; bg: string; text: string }> = {
  salary: { label: 'Salary', icon: Wallet, bg: 'bg-navy/10', text: 'text-navy' },
  withdrawal: { label: 'Withdrawal', icon: TrendingDown, bg: 'bg-danger/10', text: 'text-danger' },
  credit: { label: 'Credit', icon: HandCoins, bg: 'bg-success/10', text: 'text-success' },
};

export function WorkerTransactionViewModal({
  transaction, workerName, onClose, onEdit, onDelete,
}: WorkerTransactionViewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!transaction) return null;

  const config = TYPE_CONFIG[transaction.type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy px-6 py-5 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
              <Icon size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cream-100">{workerName}</h2>
              <p className="text-xs text-navy-200">{config.label} Transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          {/* Top info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Worker</p>
              <p className="mt-1 text-base font-bold text-navy">{workerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Date</p>
              <p className="mt-1 text-base font-semibold text-navy">{formatDate(transaction.date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Type</p>
              <span className={`mt-1 inline-flex badge ${config.bg} ${config.text}`}>
                <Icon size={12} /> {config.label}
              </span>
            </div>
          </div>

          <div className="h-px bg-cream-300" />

          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Amount</p>
              <p className={`mt-1 text-2xl font-bold ${config.text}`}>{formatCurrency(transaction.amount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Transaction ID</p>
              <p className="mt-1 text-sm font-mono text-navy-300">{transaction.id.slice(0, 12)}</p>
            </div>
          </div>

          <div className="h-px bg-cream-300" />

          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Description</p>
            {transaction.description ? (
              <p className="mt-2 text-sm text-navy bg-cream-100 rounded-xl p-4">{transaction.description}</p>
            ) : (
              <p className="mt-2 text-sm text-navy-300">No description provided.</p>
            )}
          </div>

          <div className="h-px bg-cream-300" />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Created</p>
              <p className="mt-1 text-sm text-navy-300">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Last Updated</p>
              <p className="mt-1 text-sm text-navy-300">{formatDate(transaction.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
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
  );
}
