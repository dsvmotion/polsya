import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminModeration() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and moderate flagged content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Pending Review" value={0} icon={Clock} subtitle="TODO: connect" />
        <AdminStatsCard title="Approved (30d)" value={0} icon={CheckCircle} subtitle="TODO: connect" />
        <AdminStatsCard title="Rejected (30d)" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Content moderation will be available once user-generated content features are live.
            This page will show: flagged items queue, moderation history, and auto-moderation rules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
