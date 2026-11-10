import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Package, Truck, Users, BarChart3, FileText, MapPin, Building2, ReceiptText, ClipboardList } from 'lucide-react';

const commands = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: BarChart3, shortcut: 'G D' },
  { id: 'products', label: 'Products', path: '/products', icon: Package, shortcut: 'G P' },
  { id: 'suppliers', label: 'Suppliers', path: '/suppliers', icon: Building2 },
  { id: 'clients', label: 'Clients', path: '/clients', icon: Users },
  { id: 'locations', label: 'Storage Locations', path: '/locations', icon: MapPin },
  { id: 'receipts', label: 'Goods Received', path: '/receipts', icon: ReceiptText },
  { id: 'dispatches', label: 'Dispatch Orders', path: '/dispatches', icon: Truck },
  { id: 'stock', label: 'Stock Overview', path: '/stock', icon: Package },
  { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
  { id: 'users', label: 'Users', path: '/users', icon: Users },
  { id: 'logs', label: 'Activity Logs', path: '/logs', icon: ClipboardList },
  { id: 'new-receipt', label: 'Record Goods Received', path: '/receipts/new', icon: ReceiptText },
  { id: 'new-dispatch', label: 'New Dispatch Request', path: '/dispatches/new', icon: Truck },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback((cmd) => {
    navigate(cmd.path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected]);
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, filtered, selected, execute, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-surface-1 rounded-lg shadow-overlay border border-gray-100 dark:border-border animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-border">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages and actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            aria-label="Search commands"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-surface-3 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1" role="listbox">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-6">No results for "{query}"</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              role="option"
              aria-selected={i === selected}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${i === selected ? 'bg-accent/10 text-accent' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-3'}`}
              onClick={() => execute(cmd)}
            >
              <cmd.icon className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <span className="text-xs text-gray-400">{cmd.shortcut}</span>
              )}
              <ArrowRight className="w-3.5 h-3.5 opacity-50" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
