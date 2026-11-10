import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, ArrowLeft, Mail } from 'lucide-react';
import { authApi } from '../api/index.js';
import { emailSchema } from '../lib/validationSchemas.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const schema = z.object({ email: emailSchema });

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(data);
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Password</h1>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">AGL Rwanda · WMIS</p>
        </div>

        <div className="card p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-success" aria-hidden />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Check your email</h2>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  If that email is registered, you'll receive a reset link shortly. Check the server console in development.
                </p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/login')} className="w-full">
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Forgot your password?</h2>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Enter your email address and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded bg-danger/10 border border-danger/20 text-xs text-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>

              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 mt-4 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
