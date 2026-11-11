import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../api/index.js';
import { Table, TableHead, Th, TableBody, Tr, Td, EmptyState } from '../components/ui/Table.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Badge from '../components/ui/Badge.jsx';

const actionVariant = {
  login: 'success', logout: 'neutral', login_failed: 'warning', account_locked: 'danger',
  create: 'info', update: 'info', delete: 'danger', approve: 'success',
  reject: 'danger', dispatch: 'info', password_change: 'warning',
  password_reset_request: 'warning', user_deactivated: 'danger', user_activated: 'success',
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, limit, actionFilter, startDate, endDate],
    queryFn: () => logsApi.getAll({ page, limit, action: actionFilter, startDate, endDate }).then(r => r.data),
  });

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto">
      <div><h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Activity Logs</h1><p className="text-xs text-gray-500">{data?.total ?? 0} entries</p></div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="label">Action</label>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="input w-40">
            <option value="">All actions</option>
            {['login','logout','create','update','delete','approve','reject','dispatch','password_change'].map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div><label className="label">From</label><input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input w-36" /></div>
        <div><label className="label">To</label><input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input w-36" /></div>
      </div>
      <div className="card overflow-hidden">
        <Table>
          <TableHead><Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Resource</Th><Th>Details</Th><Th>IP</Th></TableHead>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            {!isLoading && data?.data?.length === 0 && <EmptyState message="No activity logs found" />}
            {!isLoading && data?.data?.map((log) => (
              <Tr key={log._id}>
                <Td className="whitespace-nowrap text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</Td>
                <Td>
                  <div>
                    <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{log.user?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{log.userEmail}</p>
                  </div>
                </Td>
                <Td><Badge variant={actionVariant[log.action] || 'neutral'}>{log.action.replace(/_/g, ' ')}</Badge></Td>
                <Td>{log.resource || <span className="text-gray-400">N/A</span>}</Td>
                <Td className="text-xs text-gray-500 dark:text-gray-500 max-w-sm truncate">{log.details || 'N/A'}</Td>
                <Td className="text-xs text-gray-400">{log.ipAddress || 'N/A'}</Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
