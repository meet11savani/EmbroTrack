import { useMemo } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Party, EmbroideryRecord } from '@/types';
import { calculatePartySummary } from '@/utils/calculations';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface PartyTableProps {
  parties: Party[];
  records: EmbroideryRecord[];
  onView: (party: Party) => void;
  onEdit: (party: Party) => void;
  onDelete: (party: Party) => void;
}

export function PartyTable({ parties, records, onView, onEdit, onDelete }: PartyTableProps) {
  const activeParties = useMemo(() => parties.filter((p) => !p.deleted), [parties]);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-100 border-b border-cream-300">
              {['Party Name', 'Phone', 'Address', 'Records', 'Quantity', 'Amount', 'Credit', 'Debit', 'Balance', 'Actions'].map(
                (label, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3.5 text-left whitespace-nowrap ${i >= 3 && i <= 8 ? 'text-right' : ''}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-navy-300">{label}</span>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {activeParties.map((party, index) => {
              const summary = calculatePartySummary(party.id, records);
              return (
                <tr
                  key={party.id}
                  className={`border-b border-cream-200 hover:bg-cream-50 transition-colors ${
                    index % 2 === 1 ? 'bg-cream-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onView(party)}
                      className="font-semibold text-navy hover:text-teal transition-colors"
                    >
                      {party.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{party.phone || '—'}</td>
                  <td className="px-4 py-3 text-navy-300 max-w-[160px] truncate whitespace-nowrap">{party.address || '—'}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium whitespace-nowrap">{summary.totalRecords}</td>
                  <td className="px-4 py-3 text-right text-navy-300 whitespace-nowrap">{formatNumber(summary.totalQuantity)}</td>
                  <td className="px-4 py-3 text-right text-navy font-semibold whitespace-nowrap">{formatCurrency(summary.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-success font-medium whitespace-nowrap">{formatCurrency(summary.totalCredit)}</td>
                  <td className="px-4 py-3 text-right text-danger font-medium whitespace-nowrap">{formatCurrency(summary.totalDebit)}</td>
                  <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${summary.balance >= 0 ? 'text-navy' : 'text-danger'}`}>
                    {formatCurrency(summary.balance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onView(party)}
                        className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-navy-200"
                        title="View"
                        aria-label="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(party)}
                        className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                        title="Update"
                        aria-label="Update"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(party)}
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
