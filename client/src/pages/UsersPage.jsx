import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, KeyRound, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/index.js';
import { fullNameSchema, emailSchema, passwordSchema } from '../lib/validationSchemas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import PasswordInput, { PasswordStrengthMeter } from '../components/ui/PasswordInput.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

const createSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
  role: z.enum(['administrator', 'manager', 'storekeeper']),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

const editSchema = z.object({
  fullName: fullNameSchema,
  role: z.enum(['administrator', 'manager', 'storekeeper']),
  isActive: z.boolean(),
});

function UserForm({ user: editUser, onClose, onSave, currentUserId }) {
  const isEdit = !!editUser;
  const [pwdValue, setPwdValue] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit ? {
      fullName: editUser.fullName,
      role: editUser.role,
      isActive: editUser.isActive,
    } : { role: 'storekeeper' },
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        if (editUser._id === currentUserId && data.isActive === false) {
          toast.error('You cannot deactivate your own account.');
          return;
        }
        await usersApi.update(editUser._id, data);
        toast.success('User updated');
      } else {
        await usersApi.create(data);
        toast.success('User created');
      }
      onSave(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save user.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <ErrorSummary errors={errors} />
      <Input label="Full Name" required error={errors.fullName?.message} {...register('fullName')} />
      {!isEdit && (
        <>
          <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <div>
            <label className="label">Password <span className="text-danger">*</span></label>
            <input type="password" className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password', { onChange: e => setPwdValue(e.target.value) })} />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            <PasswordStrengthMeter password={pwdValue} />
          </div>
          <Input label="Confirm Password" type="password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </>
      )}
      <Select label="Role" required error={errors.role?.message} {...register('role')}>
        <option value="administrator">Administrator</option>
        <option value="manager">Warehouse Manager</option>
        <option value="storekeeper">Store Keeper</option>
      </Select>
      {isEdit && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" {...register('isActive')} className="rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Account active</span>
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'} User</Button>
      </div>
    </form>
  );
}

function ResetPasswordModal({ userId, onClose }) {
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const handleReset = async () => {
    if (pwd.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await usersApi.resetPassword(userId, { newPassword: pwd });
      toast.success('Password reset');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  };
  return (
    <Modal open onClose={onClose} title="Reset User Password" size="sm"
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button onClick={handleReset} loading={loading}>Reset Password</Button></>}>
      <div className="space-y-3">
        <PasswordInput label="New Password" required value={pwd} onChange={e => setPwd(e.target.value)} showMeter />
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch],
    queryFn: () => usersApi.getAll({ page, limit, search: debouncedSearch }).then(r => r.data),
  });

  const roleLabel = {
    administrator: 'Administrator',
    manager: 'Warehouse Manager',
    storekeeper: 'Store Keeper',
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-xs text-gray-500">{data?.total ?? 0} users</p>
        </div>
        <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New User
        </Button>
      </div>
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden />
        <input type="search" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-8" aria-label="Search users" />
      </div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Created</Th><Th className="w-24">Actions</Th>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No users found" />}
            {!isLoading && data?.data?.map((u) => (
              <Tr key={u._id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-accent">{u.fullName?.[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{u.fullName}</span>
                    {u._id === currentUser?._id && <span className="text-xs text-gray-400">(you)</span>}
                  </div>
                </Td>
                <Td>{u.email}</Td>
                <Td><span className="text-xs text-gray-600 dark:text-gray-400">{roleLabel[u.role]}</span></Td>
                <Td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></Td>
                <Td className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditItem(u); setModalOpen(true); }} className="btn-ghost p-1.5" aria-label={`Edit ${u.fullName}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setResetTarget(u._id)} className="btn-ghost p-1.5" aria-label={`Reset password for ${u.fullName}`}>
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit User' : 'New User'} size="md">
        <UserForm
          user={editItem}
          currentUserId={currentUser?._id}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={() => qc.invalidateQueries({ queryKey: ['users'] })}
        />
      </Modal>
      {resetTarget && <ResetPasswordModal userId={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}
