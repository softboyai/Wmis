import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-3 text-xs text-gray-500 dark:text-gray-500">
      <span>
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span>Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-transparent border border-gray-200 dark:border-border rounded px-1 py-0.5 text-xs cursor-pointer"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="btn-ghost p-1 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-1">{page} / {totalPages || 1}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost p-1 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
