import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, placeholder = 'Search...', id }, ref) => {
    return (
      <div className="relative flex-1 max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
        <input
          ref={ref}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-cream-300 bg-white pl-10 pr-9 py-2.5 text-sm text-navy placeholder:text-navy-300/60 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
