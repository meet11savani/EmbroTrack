import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { FilterState, RecordStatus, Party, Quality } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  parties: Party[];
  qualities: Quality[];
}

const STATUS_OPTIONS: (RecordStatus | '')[] = ['', 'Pending', 'Partially Settled', 'Settled'];

export function FilterBar({ filters, onApply, parties, qualities }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<FilterState>(filters);

  const activeCount = [filters.partyId, filters.qualityId, filters.dateFrom, filters.dateTo, filters.status]
    .filter(Boolean).length;

  const apply = () => {
    onApply(local);
    setOpen(false);
  };

  const clear = () => {
    const empty: FilterState = { partyId: '', qualityId: '', dateFrom: '', dateTo: '', status: '' };
    setLocal(empty);
    onApply(empty);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`btn-secondary ${activeCount > 0 ? 'border-teal text-teal' : ''}`}
      >
        <Filter size={16} />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal text-white text-xs font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="animate-fade-in absolute z-40 mt-2 w-80 card p-5 right-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-navy">Filter Records</h3>
              <button onClick={() => setOpen(false)} className="text-navy-300 hover:text-navy"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label-field">Party</label>
                <select
                  value={local.partyId}
                  onChange={(e) => setLocal({ ...local, partyId: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Parties</option>
                  {parties.filter(p => !p.deleted).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Quality</label>
                <select
                  value={local.qualityId}
                  onChange={(e) => setLocal({ ...local, qualityId: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Qualities</option>
                  {qualities.filter(q => !q.deleted).map((q) => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Date From</label>
                  <input type="date" value={local.dateFrom} onChange={(e) => setLocal({ ...local, dateFrom: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Date To</label>
                  <input type="date" value={local.dateTo} onChange={(e) => setLocal({ ...local, dateTo: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-field">Status</label>
                <select
                  value={local.status}
                  onChange={(e) => setLocal({ ...local, status: e.target.value as FilterState['status'] })}
                  className="input-field"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s || 'all'} value={s}>{s || 'All Statuses'}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={clear} className="btn-secondary flex-1">Clear</button>
              <button onClick={apply} className="btn-primary flex-1">Apply</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
