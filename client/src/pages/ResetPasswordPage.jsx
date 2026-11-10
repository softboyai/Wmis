import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { authApi } from '../api/index.js';
import PasswordInput, { PasswordStrengthMeter } from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError('Invalid reset link.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ token, password, confirmPassword: confirm });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-white" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Set New Password</h1>
        </div>
        <div className="card p-6 shadow-sm">
          {!token ? (
            <div className="text-center">
              <p className="text-sm text-danger mb-4">Invalid or missing reset token.</p>
              <Button variant="secondary" onClick={() => navigate('/forgot-password')}>Request new link</Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded bg-danger/10 border border-danger/20 text-xs text-danger" role="alert">{error}</div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <PasswordInput
                    label="New password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    showMeter
                  />
                </div>
                <PasswordInput
                  label="Confirm new password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                />
                <Button type="submit" className="w-full" loading={loading}>Reset password</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
