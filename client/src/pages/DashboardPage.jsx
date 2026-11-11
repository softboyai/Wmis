import { useQuery } from '@tanstack/react-query';
import { Package, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../api/index.js';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function StatCard({ label, value, icon: Icon, color = 'accent', loading }) {
  const colors = {
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  };
  if (loading) return <SkeletonCard />;
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-4.5 h-4.5" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value ?? 'N/A'}</p>
      </div>
    </div>
  );
}

function buildChartData(movements) {
  if (!movements?.length) return [];
  const map = {};
  movements.forEach(({ _id, quantity }) => {
    const date = _id.date;
    if (!map[date]) map[date] = { date, receipt: 0, dispatch: 0 };
    map[date][_id.type] = (map[date][_id.type] || 0) + quantity;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data),
    refetchInterval: 60000,
  });

  const chartData = buildChartData(data?.movementsChart);

  return (
    <div className="p-5 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">AGL Rwanda Warehouse Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Products" value={data?.stats?.totalProducts} icon={Package} loading={isLoading} />
        <StatCard label="Units in Stock" value={data?.stats?.totalUnitsInStock?.toLocaleString()} icon={Package} color="success" loading={isLoading} />
        <StatCard label="Low Stock Items" value={data?.stats?.lowStockCount} icon={AlertTriangle} color="warning" loading={isLoading} />
        <StatCard label="Pending Dispatches" value={data?.stats?.pendingDispatches} icon={Clock} color="danger" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4">Stock Movements: Last 30 Days</h2>
          {isLoading ? (
            <div className="skeleton h-48 rounded" />
          ) : chartData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-16">No movement data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDispatch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b6af5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5b6af5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, background: '#1a1a1a', border: '1px solid #2e2e2e' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="receipt" stroke="#22c55e" fill="url(#colorReceipt)" strokeWidth={1.5} name="Receipts" />
                <Area type="monotone" dataKey="dispatch" stroke="#5b6af5" fill="url(#colorDispatch)" strokeWidth={1.5} name="Dispatches" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden />
            Low Stock Alerts
          </h2>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : data?.lowStockAlerts?.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">All stock levels are healthy</p>
          ) : (
            <div className="space-y-2">
              {data?.lowStockAlerts?.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-surface-2 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{item.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-semibold text-warning">{item.currentStock}</p>
                    <p className="text-[10px] text-gray-400">min {item.minimumStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-6 rounded" />)}</div>
        ) : (
          <div className="space-y-1.5">
            {data?.recentActivity?.map((log) => (
              <div key={log._id} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 dark:border-surface-2 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{log.user?.fullName || log.userEmail || 'System'}</span>
                    {' · '}
                    <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                    {log.resource && ` · ${log.resource}`}
                  </p>
                  {log.details && <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{log.details}</p>}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
