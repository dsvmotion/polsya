import { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useWooCommerceOrders } from '@/hooks/useWooCommerceOrders';
import { useEntitiesWithOrders } from '@/hooks/useEntityOperations';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 72%, 46%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 51%)',
  'hsl(190, 80%, 50%)',
  'hsl(330, 80%, 56%)',
  'hsl(45, 93%, 47%)',
];

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

export default function Reports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: orders = [] } = useWooCommerceOrders();
  const { data: entities = [] } = useEntitiesWithOrders(true);
  const { data: kpis } = useDashboardKpis();

  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.date) >= cutoff);
  }, [orders, timeRange]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of filteredOrders) {
      const d = new Date(order.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + order.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
  }, [filteredOrders]);

  const ordersByRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of filteredOrders) {
      const region = order.province || order.country || 'Unknown';
      map.set(region, (map.get(region) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([region, count]) => ({ region, count }));
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const entity of entities) {
      const status = entity.commercialStatus || 'not_contacted';
      const label = status === 'not_contacted' ? 'Not Contacted' : status === 'contacted' ? 'Contacted' : status === 'client' ? 'Client' : status;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [entities]);

  const orderTrend = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const order of filteredOrders) {
      const d = new Date(order.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key) ?? { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += order.amount;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredOrders]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.amount, 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Visualize your sales performance and pipeline health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <PieChartIcon className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{avgOrderValue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{entities.length}</p>
                <p className="text-sm text-muted-foreground">Total Entities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary section="revenue-chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {revenueByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueByMonth}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="orders-by-region">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {ordersByRegion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersByRegion} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No regional data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="entity-status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entity Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, idx) => (
                          <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No entity data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="order-trend">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {orderTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={orderTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(142, 72%, 46%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142, 72%, 46%)', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No order trend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      {/* Pipeline KPIs */}
      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">€{(kpis.pipelineTotal ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Pipeline Value</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">€{(kpis.weightedForecast ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Weighted Forecast</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{(kpis.conversionRate ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{kpis.atRiskCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">At-Risk Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
