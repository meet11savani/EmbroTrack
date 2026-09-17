import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Quality, EmbroideryRecord } from '@/types';
import { calculateQualitySummary } from '@/utils/calculations';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface QualityTableProps {
  qualities: Quality[];
  records: EmbroideryRecord[];
  onEdit: (quality: Quality) => void;
  onDelete: (quality: Quality) => void;
}

export function QualityTable({ qualities, records, onEdit, onDelete }: QualityTableProps) {
  const activeQualities = useMemo(() => qualities.filter((q) => !q.deleted), [qualities]);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-100 border-b border-cream-300">
              {['Quality Name', 'D.No', 'Default Rate', 'Unit', 'Total Quantity', 'Total Records', 'Actions'].map(
                (label, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3.5 text-left whitespace-nowrap ${i >= 2 && i <= 5 ? 'text-right' : ''}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-navy-300">{label}</span>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {activeQualities.map((quality, index) => {
              const summary = calculateQualitySummary(quality.id, records);
              return (
                <tr
                  key={quality.id}
                  className={`border-b border-cream-200 hover:bg-cream-50 transition-colors ${
                    index % 2 === 1 ? 'bg-cream-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{quality.name}</td>
                  <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{quality.designNumber || '—'}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium whitespace-nowrap">
                    {quality.defaultRate ? formatCurrency(quality.defaultRate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{quality.unit || '—'}</td>
                  <td className="px-4 py-3 text-right text-navy-300 whitespace-nowrap">{formatNumber(summary.totalQuantity)}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium whitespace-nowrap">{summary.totalRecords}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onEdit(quality)}
                        className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                        title="Update"
                        aria-label="Update"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(quality)}
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
