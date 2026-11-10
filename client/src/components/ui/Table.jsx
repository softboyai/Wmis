import { ChevronUp, ChevronDown } from 'lucide-react';

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`} role="table">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="border-b border-gray-100 dark:border-border">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, sortKey, sortField, sortDir, onSort, className = '' }) {
  const isActive = sortField === sortKey;
  return (
    <th
      className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap ${sortKey ? 'cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200' : ''} ${className}`}
      onClick={sortKey ? () => onSort(sortKey) : undefined}
      aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey && isActive && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-50 dark:divide-surface-2">{children}</tbody>;
}

export function Tr({ children, className = '' }) {
  return <tr className={`table-row-hover ${className}`}>{children}</tr>;
}

export function Td({ children, className = '' }) {
  return <td className={`px-3 py-2.5 text-gray-700 dark:text-gray-300 ${className}`}>{children}</td>;
}

export function EmptyState({ message = 'No data found', action }) {
  return (
    <tr>
      <td colSpan={100} className="text-center py-16 text-gray-400 dark:text-gray-600">
        <div className="space-y-2">
          <p className="text-sm">{message}</p>
          {action}
        </div>
      </td>
    </tr>
  );
}
