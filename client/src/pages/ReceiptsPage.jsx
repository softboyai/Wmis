import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { receiptsApi, productsApi, suppliersApi, locationsApi } from '../api/index.js';
import { goodsReceiptSchema } from '../lib/validationSchemas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

function ReceiptForm({ onClose, onSave }) {
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productsApi.getAll({ limit: 200 }).then(r => r.data) });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: () => suppliersApi.getAll({ limit: 100 }).then(r => r.data) });
  const { data: locations } = useQuery({ queryKey: ['locations-all'], queryFn: () => locationsApi.getAll({ limit: 100 }).then(r => r.data) });

  const today = new Date().toISOString().split('T')[0];
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: { receiptDate: today, quantity: 1 },
  });

  const onSubmit = async (data) => {
    try {
      await receiptsApi.create(data);
      toast.success('Goods receipt recorded');
      onSave(); onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to record receipt.';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <ErrorSummary errors={errors} />
      <Select label="Product" required error={errors.product?.message} placeholder="Select product" {...register('product')}>
        {products?.data?.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
      </Select>
      <Select label="Supplier" required error={errors.supplier?.message} placeholder="Select supplier" {...register('supplier')}>
        {suppliers?.data?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
      </Select>
      <Select label="Storage Location" required error={errors.location?.message} placeholder="Select location" {...register('location')}>
        {locations?.data?.map(l => <option key={l._id} value={l._id}>{l.zone}-{l.rack}-{l.bin} (cap: {l.capacity})</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Quantity" type="number" required min={1} error={errors.quantity?.message} {...register('quantity')} />
        <Input label="Receipt Date" type="date" required error={errors.receiptDate?.message} max={today} {...register('receiptDate')} />
      </div>
      <div>
        <label className="label">Reference Note</label>
        <textarea className="input resize-none" rows={2} placeholder="PO number, batch, etc." {...register('referenceNote')} />
        {errors.referenceNote && <p className="text-xs text-danger mt-1">{errors.referenceNote.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Record Receipt</Button>
      </div>
    </form>
  );
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canCreate = ['administrator', 'storekeeper'].includes(user?.role);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', page, limit, startDate, endDate],
    queryFn: () => receiptsApi.getAll({ page, limit, startDate, endDate }).then(r => r.data),
  });

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Goods Received</h1><p className="text-xs text-gray-500">{data?.total ?? 0} receipts</p></div>
        {canCreate && <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Record Receipt</Button>}
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div><label className="label">From</label><input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input w-36" /></div>
        <div><label className="label">To</label><input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input w-36" /></div>
        {(startDate || endDate) && <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}>Clear</Button>}
      </div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Date</Th><Th>Product</Th><Th>Supplier</Th><Th>Location</Th><Th>Qty</Th><Th>Received By</Th><Th>Reference</Th>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
            {!isLoading && data?.data?.length === 0 && (
              <EmptyState message="No receipts found" action={canCreate && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5" /> Record first receipt</Button>} />
            )}
            {!isLoading && data?.data?.map((r) => (
              <Tr key={r._id}>
                <Td>{new Date(r.receiptDate).toLocaleDateString()}</Td>
                <Td><div><p className="font-medium text-gray-900 dark:text-gray-100">{r.product?.name}</p><p className="text-xs text-gray-400">{r.product?.sku}</p></div></Td>
                <Td>{r.supplier?.name}</Td>
                <Td><code className="text-xs bg-gray-100 dark:bg-surface-3 px-1.5 py-0.5 rounded">{r.location ? `${r.location.zone}-${r.location.rack}-${r.location.bin}` : '—'}</code></Td>
                <Td><span className="font-semibold text-success">{r.quantity}</span> <span className="text-gray-400 text-xs">{r.product?.unit}</span></Td>
                <Td>{r.receivedBy?.fullName || '—'}</Td>
                <Td className="text-gray-500 text-xs max-w-xs truncate">{r.referenceNote || '—'}</Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Goods Received" size="lg">
        <ReceiptForm onClose={() => setModalOpen(false)} onSave={() => qc.invalidateQueries({ queryKey: ['receipts'] })} />
      </Modal>
    </div>
  );
}
