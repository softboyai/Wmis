import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, CheckCircle, XCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { dispatchesApi, productsApi, clientsApi } from '../api/index.js';
import { dispatchOrderSchema } from '../lib/validationSchemas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

function DispatchForm({ onClose, onSave }) {
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productsApi.getAll({ limit: 200 }).then(r => r.data) });
  const { data: clients } = useQuery({ queryKey: ['clients-all'], queryFn: () => clientsApi.getAll({ limit: 100 }).then(r => r.data) });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(dispatchOrderSchema),
    defaultValues: { quantity: 1 },
  });

  const onSubmit = async (data) => {
    try {
      await dispatchesApi.create(data);
      toast.success('Dispatch request created');
      onSave(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create dispatch request.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <ErrorSummary errors={errors} />
      <Select label="Product" required error={errors.product?.message} placeholder="Select product" {...register('product')}>
        {products?.data?.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
      </Select>
      <Select label="Client" required error={errors.client?.message} placeholder="Select client" {...register('client')}>
        {clients?.data?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </Select>
      <Input label="Quantity" type="number" required min={1} error={errors.quantity?.message} {...register('quantity')} />
      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Optional notes..." {...register('notes')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Submit Request</Button>
      </div>
    </form>
  );
}

function RejectModal({ open, onClose, onReject }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Rejection reason is required.'); return; }
    setLoading(true);
    await onReject(reason);
    setLoading(false);
  };
  return (
    <Modal open={open} onClose={onClose} title="Reject Dispatch" size="sm"
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button variant="danger" onClick={handleReject} loading={loading}>Reject</Button></>}>
      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-500">Provide a reason for rejection (required).</p>
        <div>
          <label className="label">Reason <span className="text-danger">*</span></label>
          <textarea className="input resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter rejection reason..." />
        </div>
      </div>
    </Modal>
  );
}

export default function DispatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canCreate = ['administrator', 'storekeeper'].includes(user?.role);
  const canManage = ['administrator', 'manager'].includes(user?.role);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dispatches', page, limit, statusFilter],
    queryFn: () => dispatchesApi.getAll({ page, limit, status: statusFilter }).then(r => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dispatches'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['stock'] });
  };

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try { await dispatchesApi.approve(id); toast.success('Dispatch approved'); invalidate(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to approve.'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id, reason) => {
    try { await dispatchesApi.reject(id, { reason }); toast.success('Dispatch rejected'); setRejectTarget(null); invalidate(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to reject.'); throw err; }
  };

  const handleDispatch = async (id) => {
    setActionLoading(id + '-dispatch');
    try { await dispatchesApi.dispatch(id); toast.success('Items dispatched successfully'); invalidate(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to dispatch.'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dispatch Orders</h1><p className="text-xs text-gray-500">{data?.total ?? 0} orders</p></div>
        {canCreate && <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> New Request</Button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'dispatched', 'rejected'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-accent text-white border-accent' : 'border-gray-200 dark:border-border text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-border-strong'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Product</Th><Th>Client</Th><Th>Qty</Th><Th>Status</Th><Th>Requested By</Th><Th>Date</Th>
            {canManage && <Th className="w-32">Actions</Th>}
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
            {!isLoading && data?.data?.length === 0 && (
              <EmptyState message="No dispatch orders found" action={canCreate && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5" /> New request</Button>} />
            )}
            {!isLoading && data?.data?.map((d) => (
              <Tr key={d._id}>
                <Td><div><p className="font-medium text-gray-900 dark:text-gray-100">{d.product?.name}</p><p className="text-xs text-gray-400">{d.product?.sku}</p></div></Td>
                <Td>{d.client?.name}</Td>
                <Td><span className="font-semibold">{d.quantity}</span> <span className="text-gray-400 text-xs">{d.product?.unit}</span></Td>
                <Td>
                  <div>
                    <StatusBadge status={d.status} />
                    {d.rejectionReason && <p className="text-xs text-danger mt-0.5 max-w-xs truncate" title={d.rejectionReason}>{d.rejectionReason}</p>}
                  </div>
                </Td>
                <Td>{d.requestedBy?.fullName}</Td>
                <Td>{new Date(d.createdAt).toLocaleDateString()}</Td>
                {canManage && (
                  <Td>
                    <div className="flex items-center gap-1">
                      {d.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(d._id)} disabled={!!actionLoading} className="btn-ghost p-1.5 text-success hover:text-success" aria-label="Approve" title="Approve">
                            {actionLoading === d._id + '-approve' ? <span className="text-xs">...</span> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setRejectTarget(d._id)} disabled={!!actionLoading} className="btn-ghost p-1.5 text-danger hover:text-danger" aria-label="Reject" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {d.status === 'approved' && (
                        <button onClick={() => handleDispatch(d._id)} disabled={!!actionLoading} className="btn-ghost p-1.5 text-accent hover:text-accent" aria-label="Mark as Dispatched" title="Mark Dispatched">
                          {actionLoading === d._id + '-dispatch' ? <span className="text-xs">...</span> : <Truck className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Dispatch Request" size="md">
        <DispatchForm onClose={() => setModalOpen(false)} onSave={invalidate} />
      </Modal>
      <RejectModal open={!!rejectTarget} onClose={() => setRejectTarget(null)} onReject={(reason) => handleReject(rejectTarget, reason)} />
    </div>
  );
}
