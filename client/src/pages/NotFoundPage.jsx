import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0">
      <div className="text-center space-y-4">
        <p className="text-7xl font-bold text-gray-200 dark:text-surface-3">404</p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Page not found</h1>
        <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/dashboard')}><Home className="w-4 h-4" /> Go to Dashboard</Button>
      </div>
    </div>
  );
}
