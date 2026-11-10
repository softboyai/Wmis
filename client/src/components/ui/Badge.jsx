import { Circle } from 'lucide-react';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export default function Badge({ variant = 'neutral', children, dot = false }) {
  return (
    <span className={variants[variant]}>
      {dot && <Circle className="w-1.5 h-1.5 fill-current" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: { variant: 'info', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    dispatched: { variant: 'neutral', label: 'Dispatched' },
    rejected: { variant: 'danger', label: 'Rejected' },
    'in-stock': { variant: 'success', label: 'In Stock' },
    'low-stock': { variant: 'warning', label: 'Low Stock' },
    'out-of-stock': { variant: 'danger', label: 'Out of Stock' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
  };
  const cfg = map[status] || { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
