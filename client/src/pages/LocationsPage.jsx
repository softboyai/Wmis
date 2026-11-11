import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { locationsApi } from '../api/index.js';
import { locationSchema } from '../lib/validationSchemas.js';
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

function LocationForm({ location, onClose, onSave }) {
  const isEdit = !!location;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: location ? {
      zone: location.zone, rack: location.rack, bin: location.bin,
      capacity: location.capacity, description: location.description || '',
    } : {},
  });
  const onSubmit = async (data) => {
    try {
      if (isEdit) { await locationsApi.update(location._id, data); toast.success('Location updated'); }
      else { await locationsApi.create(data); toast.success('Location created'); }
      onSave(); onClose();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save location.'); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <ErrorSummary errors={errors} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Zone" required error={errors.zone?.message} placeholder="A" {...register('zone')} />
        <Input label="Rack" required error={errors.rack?.message} placeholder="R1" {...register('rack')} />
        <Input label="Bin" required error={errors.bin?.message} placeholder="B1" {...register('bin')} />
      </div>
      <Input label="Capacity (units)" type="number" required error={errors.capacity?.message} min={1} {...register('capacity')} />
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} {...register('description')} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'} Location</Button>
      </div>
    </form>
  );
}

function OccupancyBar({ occupancy, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((occupancy / capacity) * 100)) : 0;
  const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-surface-3 rounded-full overflow-hidden" aria-label={`${pct}% capacity used`}>
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function LocationsPage() {
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
    queryKey: ['locations', page, limit, debouncedSearch],
    queryFn: () => locationsApi.getAll({ page, limit, search: debouncedSearch }).then(r => r.data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try { await locationsApi.delete(deleteTarget._id); toast.success('Location deleted'); qc.invalidateQueries({ queryKey: ['locations'] }); setDeleteTarget(null); }
    catch { toast.error('Failed to delete location'); } finally { setDeleting(false); }
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Storage Locations</h1><p className="text-xs text-gray-500">{data?.total ?? 0} locations</p></div>
        {isAdmin && <Button onClick={() => { setEditItem(null); setModalOpen(true); }}><Plus className="w-4 h-4" /> New Location</Button>}
      </div>
      <div className="relative w-56"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden /><input type="search" placeholder="Search locations..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" aria-label="Search locations" /></div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Location</Th><Th>Zone</Th><Th>Capacity</Th><Th>Occupancy</Th><Th>Description</Th>
            {isAdmin && <Th className="w-20">Actions</Th>}
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No locations found" />}
            {!isLoading && data?.data?.map((loc) => (
              <Tr key={loc._id}>
                <Td><code className="text-xs font-semibold bg-gray-100 dark:bg-surface-3 px-1.5 py-0.5 rounded">{loc.zone}-{loc.rack}-{loc.bin}</code></Td>
                <Td>{loc.zone}</Td>
                <Td>{loc.capacity.toLocaleString()}</Td>
                <Td className="min-w-[140px]"><OccupancyBar occupancy={loc.occupancy} capacity={loc.capacity} /></Td>
                <Td className="text-gray-500 dark:text-gray-500 max-w-xs truncate">{loc.description || 'N/A'}</Td>
                {isAdmin && <Td><div className="flex items-center gap-1">
                  <button onClick={() => { setEditItem(loc); setModalOpen(true); }} className="btn-ghost p-1.5" aria-label={`Edit ${loc.zone}-${loc.rack}-${loc.bin}`}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(loc)} className="btn-ghost p-1.5 text-danger hover:text-danger" aria-label={`Delete ${loc.zone}-${loc.rack}-${loc.bin}`}><Trash2 className="w-3.5 h-3.5" /></button>
                </div></Td>}
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Location' : 'New Location'}>
        <LocationForm location={editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={() => qc.invalidateQueries({ queryKey: ['locations'] })} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Location" message={`Delete location "${deleteTarget?.zone}-${deleteTarget?.rack}-${deleteTarget?.bin}"?`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}
