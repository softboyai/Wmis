import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi } from '../api/index.js';
import { supplierSchema } from '../lib/validationSchemas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

function SupplierForm({ supplier, onClose, onSave }) {
  const isEdit = !!supplier;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {},
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await suppliersApi.update(supplier._id, data);
        toast.success('Supplier updated');
      } else {
        await suppliersApi.create(data);
        toast.success('Supplier created');
      }
      onSave(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save supplier.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <ErrorSummary errors={errors} />
      <Input label="Name" required error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} placeholder="+2507XXXXXXXX" {...register('phone')} />
      </div>
      <Input label="Contact Person" error={errors.contactPerson?.message} {...register('contactPerson')} />
      <div>
        <label className="label">Address</label>
        <textarea className="input resize-none" rows={2} {...register('address')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'} Supplier</Button>
      </div>
    </form>
  );
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'administrator';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, limit, debouncedSearch],
    queryFn: () => suppliersApi.getAll({ page, limit, search: debouncedSearch }).then(r => r.data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await suppliersApi.delete(deleteTarget._id);
      toast.success('Supplier deleted');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete supplier'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Suppliers</h1>
          <p className="text-xs text-gray-500">{data?.total ?? 0} suppliers</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> New Supplier
          </Button>
        )}
      </div>
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden />
        <input type="search" placeholder="Search suppliers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" aria-label="Search suppliers" />
      </div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Contact Person</Th>
            {isAdmin && <Th className="w-20">Actions</Th>}
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No suppliers found" />}
            {!isLoading && data?.data?.map((s) => (
              <Tr key={s._id}>
                <Td><span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span></Td>
                <Td>{s.email || <span className="text-gray-400">—</span>}</Td>
                <Td>{s.phone || <span className="text-gray-400">—</span>}</Td>
                <Td>{s.contactPerson || <span className="text-gray-400">—</span>}</Td>
                {isAdmin && (
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditItem(s); setModalOpen(true); }} className="btn-ghost p-1.5" aria-label={`Edit ${s.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="btn-ghost p-1.5 text-danger hover:text-danger" aria-label={`Delete ${s.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </Td>
                )}
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Supplier' : 'New Supplier'}>
        <SupplierForm supplier={editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={() => qc.invalidateQueries({ queryKey: ['suppliers'] })} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Supplier" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}
