import { Download, Activity, AlertTriangle, Database } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminIngestion() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Data Ingestion</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage data ingestion jobs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active Jobs" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Sources Connected" value={0} icon={Database} subtitle="TODO: connect" />
        <AdminStatsCard title="Records Processed" value={0} icon={Download} subtitle="TODO: connect" />
        <AdminStatsCard title="Errors" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ingestion Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Data ingestion monitoring will be available once ingestion sources are configured.
            This page will show: active jobs, source health, manual triggers, and error logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
