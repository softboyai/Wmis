import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../api/index.js';
import { clientSchema } from '../lib/validationSchemas.js';
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

function ClientForm({ client, onClose, onSave }) {
  const isEdit = !!client;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {},
  });
  const onSubmit = async (data) => {
    try {
      if (isEdit) { await clientsApi.update(client._id, data); toast.success('Client updated'); }
      else { await clientsApi.create(data); toast.success('Client created'); }
      onSave(); onClose();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save client.'); }
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
      <div><label className="label">Address</label><textarea className="input resize-none" rows={2} {...register('address')} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'} Client</Button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
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
    queryKey: ['clients', page, limit, debouncedSearch],
    queryFn: () => clientsApi.getAll({ page, limit, search: debouncedSearch }).then(r => r.data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try { await clientsApi.delete(deleteTarget._id); toast.success('Client deleted'); qc.invalidateQueries({ queryKey: ['clients'] }); setDeleteTarget(null); }
    catch { toast.error('Failed to delete client'); } finally { setDeleting(false); }
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Clients</h1><p className="text-xs text-gray-500">{data?.total ?? 0} clients</p></div>
        {isAdmin && <Button onClick={() => { setEditItem(null); setModalOpen(true); }}><Plus className="w-4 h-4" /> New Client</Button>}
      </div>
      <div className="relative w-56"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden /><input type="search" placeholder="Search clients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" aria-label="Search clients" /></div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Contact Person</Th>{isAdmin && <Th className="w-20">Actions</Th>}</TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No clients found" />}
            {!isLoading && data?.data?.map((c) => (
              <Tr key={c._id}>
                <Td><span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span></Td>
                <Td>{c.email || <span className="text-gray-400">N/A</span>}</Td>
                <Td>{c.phone || <span className="text-gray-400">N/A</span>}</Td>
                <Td>{c.contactPerson || <span className="text-gray-400">N/A</span>}</Td>
                {isAdmin && <Td><div className="flex items-center gap-1">
                  <button onClick={() => { setEditItem(c); setModalOpen(true); }} className="btn-ghost p-1.5" aria-label={`Edit ${c.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(c)} className="btn-ghost p-1.5 text-danger hover:text-danger" aria-label={`Delete ${c.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                </div></Td>}
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Client' : 'New Client'}>
        <ClientForm client={editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={() => qc.invalidateQueries({ queryKey: ['clients'] })} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Client" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}
