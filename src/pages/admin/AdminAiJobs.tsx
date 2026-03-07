import { BrainCircuit, Activity, Wallet, Clock } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAiJobs() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">AI Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Track AI processing jobs, usage, and costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Running Jobs" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Completed (24h)" value={0} icon={BrainCircuit} subtitle="TODO: connect" />
        <AdminStatsCard title="Total Spend" value="$0" icon={Wallet} subtitle="TODO: connect" />
        <AdminStatsCard title="Avg Duration" value="—" icon={Clock} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Job Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            AI job tracking will be available once AI processing pipelines are deployed.
            This page will show: job queue, running jobs, cost tracking, and model configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
