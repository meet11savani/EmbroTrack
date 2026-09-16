import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  error?: string;
  id?: string;
}

export function SearchableSelect({
  options, value, onChange, placeholder = 'Select...', searchPlaceholder = 'Search...',
  addNewLabel, onAddNew, error, id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [options, search]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`input-field flex items-center justify-between text-left ${error ? 'border-danger' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'text-navy' : 'text-navy-300/60'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={18} className={`text-navy-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (
        <div className="animate-fade-in absolute z-50 mt-1 w-full rounded-xl border border-cream-300 bg-white shadow-card-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-cream-200">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-cream-300 bg-cream-100 pl-9 pr-3 py-2 text-sm outline-none focus:border-teal"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-navy-300">No results found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-cream-100 transition-colors flex items-center justify-between ${
                    opt.value === value ? 'bg-teal/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy truncate">{opt.label}</div>
                    {opt.sublabel && <div className="text-xs text-navy-300 truncate">{opt.sublabel}</div>}
                  </div>
                  {opt.value === value && <Check size={16} className="text-teal flex-shrink-0 ml-2" />}
                </button>
              ))
            )}
          </div>
          {onAddNew && addNewLabel && (
            <button
              type="button"
              onClick={() => { onAddNew(); setOpen(false); setSearch(''); }}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-teal border-t border-cream-200 hover:bg-teal/5 transition-colors"
            >
              <Plus size={16} />
              {addNewLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
