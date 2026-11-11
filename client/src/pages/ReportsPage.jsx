import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi, productsApi } from '../api/index.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';

const tabs = [
  { id: 'stock', label: 'Stock Report', icon: BarChart2 },
  { id: 'receipts', label: 'Receipts Report', icon: FileText },
  { id: 'dispatches', label: 'Dispatches Report', icon: Truck },
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState('stock');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [downloading, setDownloading] = useState(null);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => productsApi.getCategories().then(r => r.data) });

  const params = { startDate, endDate, category };

  const { data: stockData, isLoading: loadingStock } = useQuery({
    queryKey: ['report-stock', params], enabled: tab === 'stock',
    queryFn: () => reportsApi.getStock(params).then(r => r.data),
  });
  const { data: receiptsData, isLoading: loadingReceipts } = useQuery({
    queryKey: ['report-receipts', params], enabled: tab === 'receipts',
    queryFn: () => reportsApi.getReceipts(params).then(r => r.data),
  });
  const { data: dispatchesData, isLoading: loadingDispatches } = useQuery({
    queryKey: ['report-dispatches', params], enabled: tab === 'dispatches',
    queryFn: () => reportsApi.getDispatches(params).then(r => r.data),
  });

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      let res;
      if (tab === 'stock') res = await reportsApi.downloadStock({ ...params, format });
      else if (tab === 'receipts') res = await reportsApi.downloadReceipts({ ...params, format });
      else res = await reportsApi.downloadDispatches({ ...params, format });
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      downloadBlob(res.data, `${tab}-report.${ext}`);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch { toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  const isLoading = tab === 'stock' ? loadingStock : tab === 'receipts' ? loadingReceipts : loadingDispatches;

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Reports</h1><p className="text-xs text-gray-500">Generate and export reports</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleDownload('csv')} loading={downloading === 'csv'}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleDownload('pdf')} loading={downloading === 'pdf'}>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <t.icon className="w-3.5 h-3.5" aria-hidden />{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="label">From</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-36" /></div>
        <div><label className="label">To</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-36" /></div>
        <div>
          <label className="label">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input w-40">
            <option value="">All</option>
            {categories?.data?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(startDate || endDate || category) && <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); setCategory(''); }}>Clear filters</Button>}
      </div>

      {/* Stock table */}
      {tab === 'stock' && (
        <div className="card overflow-hidden">
          <Table>
            <TableHead><Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th>Unit</Th><Th>Supplier</Th><Th>Current Stock</Th><Th>Min Stock</Th><Th>Status</Th></TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}
              {!isLoading && (!stockData?.data || stockData.data.length === 0) && <EmptyState message="No stock data" />}
              {!isLoading && stockData?.data?.map((r, i) => (
                <Tr key={i}>
                  <Td><span className="font-medium">{r.name}</span></Td><Td>{r.sku}</Td><Td>{r.category}</Td><Td>{r.unit}</Td><Td>{r.supplier}</Td>
                  <Td><span className={`font-semibold ${r.status === 'Out of Stock' ? 'text-danger' : r.status === 'Low Stock' ? 'text-warning' : 'text-success'}`}>{r.currentStock}</span></Td>
                  <Td>{r.minimumStock}</Td><Td><span className={`badge ${r.status === 'In Stock' ? 'badge-success' : r.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 dark:border-border">Total: {stockData?.total ?? 0} products</div>
        </div>
      )}

      {/* Receipts table */}
      {tab === 'receipts' && (
        <div className="card overflow-hidden">
          <Table>
            <TableHead><Th>Date</Th><Th>Product</Th><Th>Supplier</Th><Th>Location</Th><Th>Qty</Th><Th>Received By</Th></TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              {!isLoading && (!receiptsData?.data || receiptsData.data.length === 0) && <EmptyState message="No receipts in this period" />}
              {!isLoading && receiptsData?.data?.map((r) => (
                <Tr key={r._id}>
                  <Td>{new Date(r.receiptDate).toLocaleDateString()}</Td>
                  <Td>{r.product?.name}</Td><Td>{r.supplier?.name}</Td>
                  <Td>{r.location ? `${r.location.zone}-${r.location.rack}-${r.location.bin}` : 'N/A'}</Td>
                  <Td>{r.quantity}</Td><Td>{r.receivedBy?.fullName}</Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 dark:border-border">Total: {receiptsData?.total ?? 0}</div>
        </div>
      )}

      {/* Dispatches table */}
      {tab === 'dispatches' && (
        <div className="card overflow-hidden">
          <Table>
            <TableHead><Th>Date</Th><Th>Product</Th><Th>Client</Th><Th>Qty</Th><Th>Status</Th><Th>Requested By</Th></TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              {!isLoading && (!dispatchesData?.data || dispatchesData.data.length === 0) && <EmptyState message="No dispatches in this period" />}
              {!isLoading && dispatchesData?.data?.map((d) => (
                <Tr key={d._id}>
                  <Td>{new Date(d.createdAt).toLocaleDateString()}</Td>
                  <Td>{d.product?.name}</Td><Td>{d.client?.name}</Td><Td>{d.quantity}</Td>
                  <Td><StatusBadge status={d.status} /></Td><Td>{d.requestedBy?.fullName}</Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 dark:border-border">Total: {dispatchesData?.total ?? 0}</div>
        </div>
      )}
    </div>
  );
}
