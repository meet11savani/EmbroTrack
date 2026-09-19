import { useEffect, useMemo } from 'react';
import { X, Users, FileText } from 'lucide-react';
import type { Party, EmbroideryRecord, AppSettings } from '@/types';
import { calculatePartySummary } from '@/utils/calculations';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

interface PartyViewModalProps {
  party: Party | null;
  records: EmbroideryRecord[];
  settings: AppSettings;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewRecord: (record: EmbroideryRecord) => void;
}

export function PartyViewModal({
  party, records, onClose, onViewRecord,
}: PartyViewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const partyRecords = useMemo(() => {
    if (!party) return [];
    return records
      .filter((r) => r.partyId === party.id && !r.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [party, records]);

  const summary = useMemo(() => {
    if (!party) return null;
    return calculatePartySummary(party.id, records);
  }, [party, records]);

  if (!party || !summary) return null;

  const STATUS_STYLES: Record<string, string> = {
    Pending: 'bg-warning/10 text-warning',
    'Partially Settled': 'bg-info/10 text-info',
    Settled: 'bg-success/10 text-success',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy px-6 py-5 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cream-100">{party.name}</h2>
              <p className="text-xs text-navy-200">Party Details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 lg:p-8 space-y-5">
          {/* Party info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Phone</p>
              <p className="mt-1 text-sm font-semibold text-navy">{party.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Address</p>
              <p className="mt-1 text-sm font-semibold text-navy">{party.address || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Records</p>
              <p className="mt-1 text-sm font-semibold text-navy">{summary.totalRecords}</p>
            </div>
          </div>

          {party.notes && (
            <>
              <div className="h-px bg-cream-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Notes</p>
                <p className="mt-2 text-sm text-navy bg-cream-100 rounded-xl p-4">{party.notes}</p>
              </div>
            </>
          )}

          <div className="h-px bg-cream-300" />

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Records', value: String(summary.totalRecords), color: 'text-navy' },
              { label: 'Quantity', value: formatNumber(summary.totalQuantity), color: 'text-navy' },
              { label: 'Amount', value: formatCurrency(summary.totalAmount), color: 'text-navy' },
              { label: 'Credit', value: formatCurrency(summary.totalCredit), color: 'text-success' },
              { label: 'Debit', value: formatCurrency(summary.totalDebit), color: 'text-danger' },
              { label: 'Balance', value: formatCurrency(summary.balance), color: summary.balance >= 0 ? 'text-navy' : 'text-danger' },
            ].map((item) => (
              <div key={item.label} className="bg-cream-100 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{item.label}</p>
                <p className={`mt-1 text-base font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-cream-300" />

          {/* Record list */}
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy-300">Transaction History</h3>

          {partyRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center mx-auto mb-2">
                <FileText size={20} className="text-navy-300" />
              </div>
              <p className="text-sm text-navy-300">No records found for this party.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {partyRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => onViewRecord(record)}
                  className="w-full flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-50"
                >
                  <span className="font-semibold text-navy text-sm whitespace-nowrap">{record.challanNumber}</span>
                  <span className="text-sm text-navy-300 whitespace-nowrap">{formatDate(record.date)}</span>
                  <span className="text-sm text-navy-300 max-w-[120px] truncate hidden sm:block">{record.qualityName}</span>
                  <span className={`badge ${STATUS_STYLES[record.status]} ml-auto whitespace-nowrap`}>{record.status}</span>
                  <span className="text-sm font-semibold text-navy whitespace-nowrap">{formatCurrency(record.amount)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
