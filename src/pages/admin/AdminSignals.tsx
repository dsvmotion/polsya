import { Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSignals() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Signals Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Monitor creative intelligence signal pipeline health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active Signal Types" value={0} icon={Zap} subtitle="TODO: connect" />
        <AdminStatsCard title="Processed (24h)" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Errors (24h)" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
        <AdminStatsCard title="Success Rate" value="—" icon={CheckCircle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Signal Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Signal monitoring will be available once the intelligence pipeline is deployed.
            This page will show: signal types, processing rates, error rates, and alert thresholds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
