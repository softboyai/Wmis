import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle } from 'lucide-react';
import { stockApi, productsApi } from '../api/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import Pagination from '../components/ui/Pagination.jsx';

export default function StockPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['stock', page, limit, debouncedSearch, category, lowStockOnly],
    queryFn: () => stockApi.getAll({ page, limit, search: debouncedSearch, category, lowStock: lowStockOnly }).then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then(r => r.data),
  });

  const getStockStatus = (item) => {
    if (item.isOutOfStock) return 'out-of-stock';
    if (item.isLowStock) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Stock Overview</h1><p className="text-xs text-gray-500">Real-time inventory levels</p></div>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden />
          <input type="search" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-8 w-56" aria-label="Search stock" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input w-40" aria-label="Filter by category">
          <option value="">All categories</option>
          {categories?.data?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={lowStockOnly} onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }} className="rounded" />
          <AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        <Table>
          <TableHead>
            <Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th>Unit</Th><Th>Current Stock</Th><Th>Min Stock</Th><Th>Status</Th>
          </TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No stock data found" />}
            {!isLoading && data?.data?.map((item) => (
              <Tr key={item.product._id}>
                <Td><span className="font-medium text-gray-900 dark:text-gray-100">{item.product.name}</span></Td>
                <Td><code className="text-xs bg-gray-100 dark:bg-surface-3 px-1.5 py-0.5 rounded">{item.product.sku}</code></Td>
                <Td>{item.product.category}</Td>
                <Td>{item.product.unit}</Td>
                <Td>
                  <span className={`font-semibold text-sm ${item.isOutOfStock ? 'text-danger' : item.isLowStock ? 'text-warning' : 'text-success'}`}>
                    {item.totalQuantity.toLocaleString()}
                  </span>
                </Td>
                <Td>{item.minimumStock}</Td>
                <Td><StatusBadge status={getStockStatus(item)} /></Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
