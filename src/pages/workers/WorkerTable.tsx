import { useMemo } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Worker, WorkerTransaction, WorkerSummary } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface WorkerTableProps {
  workers: Worker[];
  transactions: WorkerTransaction[];
  onView: (worker: Worker) => void;
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
}

function calculateWorkerSummary(workerId: string, transactions: WorkerTransaction[]): WorkerSummary {
  const workerTxns = transactions.filter((t) => t.workerId === workerId && !t.deleted);
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
    transactionCount: workerTxns.length,
  };
}

export function WorkerTable({ workers, transactions, onView, onEdit, onDelete }: WorkerTableProps) {
  const activeWorkers = useMemo(() => workers.filter((w) => !w.deleted), [workers]);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-100 border-b border-cream-300">
              {['Worker Name', 'Phone', 'Role', 'Salary', 'Withdrawal', 'Credit', 'Balance', 'Actions'].map(
                (label, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3.5 text-left whitespace-nowrap ${i >= 3 && i <= 6 ? 'text-right' : ''}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-navy-300">{label}</span>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {activeWorkers.map((worker, index) => {
              const summary = calculateWorkerSummary(worker.id, transactions);
              return (
                <tr
                  key={worker.id}
                  className={`border-b border-cream-200 hover:bg-cream-50 transition-colors ${
                    index % 2 === 1 ? 'bg-cream-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onView(worker)}
                      className="font-semibold text-navy hover:text-teal transition-colors"
                    >
                      {worker.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{worker.phone || '—'}</td>
                  <td className="px-4 py-3 text-navy-300 max-w-[180px] truncate whitespace-nowrap">{worker.role || '—'}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium whitespace-nowrap">{formatCurrency(summary.totalSalary)}</td>
                  <td className="px-4 py-3 text-right text-danger font-medium whitespace-nowrap">{formatCurrency(summary.totalWithdrawal)}</td>
                  <td className="px-4 py-3 text-right text-success font-medium whitespace-nowrap">{formatCurrency(summary.totalCredit)}</td>
                  <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${summary.balance >= 0 ? 'text-navy' : 'text-danger'}`}>
                    {formatCurrency(summary.balance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onView(worker)}
                        className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-navy-200"
                        title="View"
                        aria-label="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(worker)}
                        className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                        title="Update"
                        aria-label="Update"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(worker)}
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
  );
}
