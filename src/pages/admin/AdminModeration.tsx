import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminModeration() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and moderate flagged content across organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard
          title="Pending Review"
          value={0}
          icon={Clock}
          subtitle="No items queued"
        />
        <AdminStatsCard
          title="Approved (30d)"
          value={0}
          icon={CheckCircle}
          subtitle="No activity"
        />
        <AdminStatsCard
          title="Rejected (30d)"
          value={0}
          icon={AlertTriangle}
          subtitle="No activity"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" /> Moderation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-3">
            <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No moderation features active
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                Content moderation will activate when user-generated content features are deployed.
                This page will display a flagged items queue, moderation history, and auto-moderation rules.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
