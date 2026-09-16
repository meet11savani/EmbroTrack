import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage, totalPages, totalRecords, pageSize, onPageChange, onPageSizeChange,
}: PaginationProps) {
  if (totalRecords === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);

  const sizes = [25, 50, 100];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-cream-300">
      <div className="flex items-center gap-4">
        <span className="text-sm text-navy-300">
          Showing <span className="font-semibold text-navy">{start}–{end}</span> of{' '}
          <span className="font-semibold text-navy">{totalRecords}</span> records
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-300">Per page:</span>
          <div className="flex rounded-lg border border-cream-300 overflow-hidden">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => onPageSizeChange(s)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  pageSize === s ? 'bg-navy text-cream-100' : 'bg-white text-navy-300 hover:bg-cream-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-ghost disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="px-3 text-sm font-medium text-navy">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-ghost disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
