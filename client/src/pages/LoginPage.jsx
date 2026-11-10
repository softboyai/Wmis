import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { loginSchema } from '../lib/validationSchemas.js';
import Input from '../components/ui/Input.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-white" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AGL Rwanda</h1>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Warehouse Management System</p>
        </div>

        <div className="card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-5">Sign in to your account</h2>

          {serverError && (
            <div
              className="mb-4 p-3 rounded bg-danger/10 border border-danger/20 text-xs text-danger"
              role="alert"
              aria-live="assertive"
            >
              {serverError}
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
            <div>
              <PasswordInput
                label="Password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="mt-1.5 text-right">
                <a
                  href="/forgot-password"
                  className="text-xs text-accent hover:underline"
                  onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Africa Global Logistics Rwanda · WMIS v1.0
        </p>
      </div>
    </div>
  );
}
