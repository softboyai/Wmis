import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, suppliersApi } from '../api/index.js';
import { productSchema } from '../lib/validationSchemas.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';

function ProductForm({ product, suppliers, onClose, onSave }) {
  const isEdit = !!product;
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name, sku: product.sku, category: product.category,
      unit: product.unit, minimumStock: product.minimumStock,
      supplier: product.supplier?._id || '', description: product.description || '',
    } : { minimumStock: 0 },
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await productsApi.update(product._id, data);
        toast.success('Product updated');
      } else {
        await productsApi.create(data);
        toast.success('Product created');
      }
      onSave();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save product.';
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors?.length) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3" id="product-form">
      <ErrorSummary errors={errors} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input label="Product Name" required error={errors.name?.message} {...register('name')} />
        </div>
        <Input label="SKU" required error={errors.sku?.message} placeholder="e.g. CEM-001" {...register('sku')} />
        <Input label="Category" required error={errors.category?.message} placeholder="e.g. Construction" {...register('category')} />
        <Input label="Unit" required error={errors.unit?.message} placeholder="e.g. bags" {...register('unit')} />
        <Input label="Minimum Stock" type="number" required error={errors.minimumStock?.message} min={0} {...register('minimumStock')} />
        <div className="col-span-2">
          <Select label="Supplier" placeholder="Select supplier (optional)" error={errors.supplier?.message} {...register('supplier')}>
            {suppliers?.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Optional description..."
            {...register('description')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'} Product</Button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'administrator';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch, categoryFilter],
    queryFn: () => productsApi.getAll({ page, limit, search: debouncedSearch, category: categoryFilter }).then(r => r.data),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => suppliersApi.getAll({ limit: 100 }).then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then(r => r.data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget._id);
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Products</h1>
          <p className="text-xs text-gray-500 dark:text-gray-500">{data?.total ?? 0} products</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditProduct(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> New Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-8 w-56"
            aria-label="Search products"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input w-40"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories?.data?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Name</Th>
            <Th>SKU</Th>
            <Th>Category</Th>
            <Th>Unit</Th>
            <Th>Min Stock</Th>
            <Th>Supplier</Th>
            {isAdmin && <Th className="w-20">Actions</Th>}
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={isAdmin ? 7 : 6} />)}
            {!isLoading && data?.data?.length === 0 && (
              <EmptyState
                message="No products found"
                action={isAdmin && (
                  <Button size="sm" onClick={() => setModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> Add first product
                  </Button>
                )}
              />
            )}
            {!isLoading && data?.data?.map((product) => (
              <Tr key={product._id}>
                <Td>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                  {product.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.description}</p>}
                </Td>
                <Td><code className="text-xs bg-gray-100 dark:bg-surface-3 px-1.5 py-0.5 rounded">{product.sku}</code></Td>
                <Td>{product.category}</Td>
                <Td>{product.unit}</Td>
                <Td>{product.minimumStock}</Td>
                <Td>{product.supplier?.name || <span className="text-gray-400">N/A</span>}</Td>
                {isAdmin && (
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditProduct(product); setModalOpen(true); }}
                        className="btn-ghost p-1.5"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="btn-ghost p-1.5 text-danger hover:text-danger"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                )}
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(n) => { setLimit(n); setPage(1); }}
        />
      </div>

      {/* Product form modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        title={editProduct ? 'Edit Product' : 'New Product'}
        size="lg"
      >
        <ProductForm
          product={editProduct}
          suppliers={suppliersData}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          onSave={() => qc.invalidateQueries({ queryKey: ['products'] })}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
