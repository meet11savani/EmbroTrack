import { useMemo } from 'react';
import { Eye, Pencil, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { EmbroideryRecord, SortState } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

interface RecordTableProps {
  records: EmbroideryRecord[];
  sortState: SortState;
  onSort: (field: string) => void;
  onView: (record: EmbroideryRecord) => void;
  onEdit: (record: EmbroideryRecord) => void;
  onPdf: (record: EmbroideryRecord) => void;
  onDelete: (record: EmbroideryRecord) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

interface ColumnDef {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'challanNumber', label: 'Challan No.', sortable: true },
  { key: 'partyName', label: 'Party', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'qualityName', label: 'Quality', sortable: true },
  { key: 'designNumber', label: 'D.No', sortable: false },
  { key: 'quantity', label: 'Quantity', sortable: true, className: 'text-right' },
  { key: 'amount', label: 'Amount', sortable: true, className: 'text-right' },
  { key: 'action', label: 'Actions', sortable: false },
];

export function RecordTable({
  records, sortState, onSort, onView, onEdit, onPdf, onDelete,
  selectedIds, onToggleSelect, onToggleSelectAll,
}: RecordTableProps) {
  const allSelected = useMemo(
    () => records.length > 0 && records.every((r) => selectedIds.has(r.id)),
    [records, selectedIds]
  );

  const getSortIcon = (field: string) => {
    if (sortState.field !== field) return <ArrowUpDown size={12} className="text-navy-300/50" />;
    if (sortState.direction === 'asc') return <ArrowUp size={12} className="text-teal" />;
    return <ArrowDown size={12} className="text-teal" />;
  };

  const handleSort = (field: string, sortable: boolean) => {
    if (sortable) onSort(field);
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-100 border-b border-cream-300">
              <th className="sticky top-0 z-10 bg-cream-100 px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-cream-400 text-teal focus:ring-teal cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`sticky top-0 z-10 bg-cream-100 px-4 py-3.5 text-left whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:bg-cream-200 transition-colors' : ''
                  } ${col.className || ''}`}
                >
                  <div className={`flex items-center gap-1.5 ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
                    <span className="text-xs font-bold uppercase tracking-wide text-navy-300">{col.label}</span>
                    {col.sortable && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr
                key={record.id}
                className={`border-b border-cream-200 transition-colors hover:bg-cream-50 ${
                  index % 2 === 1 ? 'bg-cream-50/50' : ''
                } ${selectedIds.has(record.id) ? 'bg-teal/5' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => onToggleSelect(record.id)}
                    className="w-4 h-4 rounded border-cream-400 text-teal focus:ring-teal cursor-pointer"
                    aria-label={`Select ${record.challanNumber}`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => onView(record)}
                    className="font-semibold text-navy hover:text-teal transition-colors"
                  >
                    {record.challanNumber}
                  </button>
                </td>
                <td className="px-4 py-3 text-navy whitespace-nowrap max-w-[180px] truncate">{record.partyName}</td>
                <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{formatDate(record.date)}</td>
                <td className="px-4 py-3 text-navy whitespace-nowrap max-w-[160px] truncate">{record.qualityName}</td>
                <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{record.designNumber || '—'}</td>
                <td className="px-4 py-3 text-right text-navy font-medium whitespace-nowrap">{formatNumber(record.quantity)}</td>
                <td className="px-4 py-3 text-right text-navy font-semibold whitespace-nowrap">{formatCurrency(record.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onView(record)}
                      className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-navy-200"
                      title="View"
                      aria-label="View"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(record)}
                      className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                      title="Update"
                      aria-label="Update"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onPdf(record)}
                      className="w-7 h-7 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-navy transition-colors hover:bg-cream-100 hover:border-teal hover:text-teal"
                      title="Download PDF"
                      aria-label="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(record)}
                      className="w-7 h-7 rounded-lg border border-danger/20 bg-danger/5 flex items-center justify-center text-danger transition-colors hover:bg-danger hover:text-white"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
  