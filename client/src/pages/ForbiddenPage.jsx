import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
          <ShieldOff className="w-7 h-7 text-danger" aria-hidden />
        </div>
        <p className="text-5xl font-bold text-gray-200 dark:text-surface-3">403</p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access denied</h1>
        <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> Go back</Button>
      </div>
    </div>
  );
}
