import { useEffect } from 'react';
import { X, Printer, Download, Pencil } from 'lucide-react';
import type { EmbroideryRecord, AppSettings } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

interface RecordViewModalProps {
  record: EmbroideryRecord | null;
  settings: AppSettings;
  onClose: () => void;
  onPrint: () => void;
  onPdf: () => void;
  onEdit: () => void;
}

export function RecordViewModal({
  record, settings, onClose, onPrint, onPdf, onEdit,
}: RecordViewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!record) return null;

  const STATUS_STYLES: Record<string, string> = {
    Pending: 'bg-warning/10 text-warning',
    'Partially Settled': 'bg-info/10 text-info',
    Settled: 'bg-success/10 text-success',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy px-6 py-5 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-bold text-cream-100">{settings.businessName}</h2>
            <p className="text-xs text-navy-200">Challan {record.challanNumber}</p>
          </div>
          <button onClick={onClose} className="text-navy-200 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          {/* Top info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Challan No.</p>
              <p className="mt-1 text-base font-bold text-navy">{record.challanNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Date</p>
              <p className="mt-1 text-base font-semibold text-navy">{formatDate(record.date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Party</p>
              <p className="mt-1 text-base font-semibold text-navy">{record.partyName}</p>
            </div>
          </div>

          <div className="h-px bg-cream-300" />

          {/* Details */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Quality</p>
              <p className="mt-1 text-sm font-semibold text-navy">{record.qualityName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">D.No</p>
              <p className="mt-1 text-sm font-semibold text-navy">{record.designNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Quantity</p>
              <p className="mt-1 text-sm font-semibold text-navy">{formatNumber(record.quantity)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Rate</p>
              <p className="mt-1 text-sm font-semibold text-navy">{formatCurrency(record.rate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Amount</p>
              <p className="mt-1 text-sm font-bold text-navy">{formatCurrency(record.amount)}</p>
            </div>
          </div>

          <div className="h-px bg-cream-300" />

          {/* Transaction info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Credit Date</p>
              <p className="mt-1 text-sm font-semibold text-navy">{formatDate(record.creditDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Debit Date</p>
              <p className="mt-1 text-sm font-semibold text-navy">{formatDate(record.debitDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Status</p>
              <span className={`mt-1 inline-flex badge ${STATUS_STYLES[record.status]}`}>{record.status}</span>
            </div>
          </div>

          {record.notes && (
            <>
              <div className="h-px bg-cream-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Notes</p>
                <p className="mt-2 text-sm text-navy bg-cream-100 rounded-xl p-4">{record.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-cream-300 px-6 py-4 flex items-center gap-3 rounded-b-3xl">
          <button onClick={onPrint} className="btn-secondary">
            <Printer size={16} /> Print
          </button>
          <button onClick={onPdf} className="btn-secondary">
            <Download size={16} /> Download PDF
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
