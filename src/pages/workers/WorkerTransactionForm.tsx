import { useState, useEffect, type FormEvent } from 'react';
import { X, Plus, Save, Wallet, TrendingDown, HandCoins } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { todayISO } from '@/utils/formatters';
import type { WorkerTransaction, WorkerTransactionType } from '@/types';

export interface WorkerTxnFormData {
  type: WorkerTransactionType;
  date: string;
  amount: string;
  description: string;
}

interface WorkerTransactionFormProps {
  workerId: string;
  workerName: string;
  editingTxn?: WorkerTransaction | null;
  onClose: () => void;
  onSaved?: () => void;
}

const TYPE_OPTIONS: { value: WorkerTransactionType; label: string; icon: typeof Wallet }[] = [
  { value: 'salary', label: 'Salary', icon: Wallet },
  { value: 'withdrawal', label: 'Withdrawal', icon: TrendingDown },
  { value: 'credit', label: 'Credit', icon: HandCoins },
];

export function WorkerTransactionForm({
  workerId, workerName, editingTxn, onClose, onSaved,
}: WorkerTransactionFormProps) {
  const { addWorkerTransaction, updateWorkerTransaction } = useApp();
  const isEditing = !!editingTxn;
  const [formData, setFormData] = useState<WorkerTxnFormData>({
    type: 'salary',
    date: todayISO(),
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTxn) {
      setFormData({
        type: editingTxn.type,
        date: editingTxn.date,
        amount: String(editingTxn.amount),
        description: editingTxn.description,
      });
    }
  }, [editingTxn]);

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

    if (isEditing && editingTxn) {
      updateWorkerTransaction(editingTxn.id, {
        type: formData.type,
        date: formData.date,
        amount,
        description: formData.description.trim(),
      });
    } else {
      addWorkerTransaction({
        workerId,
        workerName,
        type: formData.type,
        date: formData.date,
        amount,
        description: formData.description.trim(),
      });
    }
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
              {isEditing ? <Save size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <p className="text-xs text-navy-300">{workerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-navy">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector as buttons */}
          <div>
            <label className="label-field">Type <span className="text-danger">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = formData.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: opt.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-teal bg-teal/5 text-teal'
                        : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
                    }`}
                  >
                    <Icon size={18} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                autoFocus
              />
              {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <label className="label-field">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[60px] resize-y"
              placeholder="Monthly salary, cash withdrawal, advance credit..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEditing ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
