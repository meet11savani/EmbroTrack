import { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeft, Search } from 'lucide-react';
import type { Party, EmbroideryRecord, AppSettings } from '@/types';
import { calculatePartySummary } from '@/utils/calculations';
import { formatCurrency, formatNumber} from '@/utils/formatters';
import { RecordTable } from '../records/RecordTable';
import type { SortState } from '@/types';

interface PartyDetailsProps {
  party: Party | null;
  records: EmbroideryRecord[];
  settings: AppSettings;
  onClose: () => void;
  onPrintRecord: (record: EmbroideryRecord) => void;
  onPdfRecord: (record: EmbroideryRecord) => void;
}

export function PartyDetails({
  party, records, onClose, onPrintRecord, onPdfRecord,
}: PartyDetailsProps) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortState, setSortState] = useState<SortState>({ field: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const partyRecords = useMemo(() => {
    if (!party) return [];
    let filtered = records.filter((r) => r.partyId === party.id && !r.deleted);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.challanNumber.toLowerCase().includes(q) ||
          r.qualityName.toLowerCase().includes(q) ||
          r.designNumber.toLowerCase().includes(q)
      );
    }
    if (dateFrom) filtered = filtered.filter((r) => r.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((r) => r.date <= dateTo);
    return filtered;
  }, [party, records, search, dateFrom, dateTo]);

  const sortedRecords = useMemo(() => {
    const sorted = [...partyRecords];
    const { field, direction } = sortState;
    sorted.sort((a, b) => {
      let aVal: string | number = (a as unknown as Record<string, unknown>)[field] as string | number;
      let bVal: string | number = (b as unknown as Record<string, unknown>)[field] as string | number;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [partyRecords, sortState]);

  if (!party) return null;

  const summary = calculatePartySummary(party.id, records);

  const handleSort = (field: string) => {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (sortedRecords.every((r) => prev.has(r.id))) return new Set();
      return new Set(sortedRecords.map((r) => r.id));
    });
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
            <h2 className="text-lg font-bold text-cream-100">{party.name}</h2>
            <p className="text-xs text-navy-200">Party Details</p>
          </div>
        </div>
        <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
          <X size={22} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Party info card */}
        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Party Name</p>
              <p className="mt-1 text-lg font-bold text-navy">{party.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Phone</p>
              <p className="mt-1 text-base font-semibold text-navy">{party.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Address</p>
              <p className="mt-1 text-base font-semibold text-navy">{party.address || '—'}</p>
            </div>
          </div>
          {party.notes && (
            <div className="mt-4 pt-4 border-t border-cream-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Notes</p>
              <p className="mt-1 text-sm text-navy">{party.notes}</p>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Records', value: String(summary.totalRecords), color: 'text-navy' },
            { label: 'Total Quantity', value: formatNumber(summary.totalQuantity), color: 'text-navy' },
            { label: 'Total Amount', value: formatCurrency(summary.totalAmount), color: 'text-navy' },
            { label: 'Total Credit', value: formatCurrency(summary.totalCredit), color: 'text-success' },
            { label: 'Total Debit', value: formatCurrency(summary.totalDebit), color: 'text-danger' },
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="rounded-xl border border-cream-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-teal w-48"
                />
              </div>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto" />
            </div>
          </div>

          {sortedRecords.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-navy-300">No transactions found for this party.</p>
            </div>
          ) : (
            <RecordTable
              records={sortedRecords}
              sortState={sortState}
              onSort={handleSort}
              onView={(r) => onPrintRecord(r)}
              onEdit={() => {}}
              onPdf={onPdfRecord}
              onDelete={() => {}}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
