import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { authApi } from '../api/index.js';
import { changePasswordSchema } from '../lib/validationSchemas.js';
import Input from '../components/ui/Input.jsx';
import PasswordInput, { PasswordStrengthMeter } from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [pwdValue, setPwdValue] = useState('');

  const schema = changePasswordSchema(user?.email || '', user?.fullName || '');
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed successfully');
      reset();
      setPwdValue('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    }
  };

  const roleLabel = { administrator: 'Administrator', manager: 'Warehouse Manager', storekeeper: 'Store Keeper' }[user?.role] || user?.role;

  return (
    <div className="p-5 space-y-6 max-w-2xl mx-auto">
      <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h1></div>

      {/* Profile card */}
      <div className="card p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-accent">{user?.fullName?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="mt-1 inline-block text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{roleLabel}</span>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ErrorSummary errors={errors} />
          <PasswordInput label="Current Password" required error={errors.currentPassword?.message} {...register('currentPassword')} />
          <div>
            <PasswordInput
              label="New Password" required error={errors.newPassword?.message}
              {...register('newPassword', { onChange: e => setPwdValue(e.target.value) })}
            />
            <PasswordStrengthMeter password={pwdValue} />
          </div>
          <PasswordInput label="Confirm New Password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>Change Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
