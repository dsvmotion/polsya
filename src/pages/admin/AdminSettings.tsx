import { Settings, UserPlus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlatformOwnerEmails } from '@/hooks/usePlatformOwnerEmails';
import { useAddPlatformOwner } from '@/hooks/useAddPlatformOwner';
import { useRemovePlatformOwner } from '@/hooks/useRemovePlatformOwner';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: owners = [], isLoading } = usePlatformOwnerEmails();
  const addOwner = useAddPlatformOwner();
  const removeOwner = useRemovePlatformOwner();
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    addOwner.mutate(email, {
      onSuccess: () => {
        setNewEmail('');
        toast.success(`Added ${email} as admin`);
      },
    });
  };

  const handleRemove = (email: string) => {
    if (owners.length <= 1) {
      toast.error('Cannot remove the last admin');
      return;
    }
    removeOwner.mutate(email, {
      onSuccess: () => toast.success(`Removed ${email}`),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage platform administrators and system configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Administrators</CardTitle>
          <CardDescription>
            Users with admin access can view all organizations, manage subscriptions, and access system logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@company.com"
              type="email"
              className="max-w-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={addOwner.isPending} className="gap-2">
              <UserPlus className="h-4 w-4" /> Add
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-2">
              {owners.map((owner) => (
                <div key={owner.id ?? owner.email} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{owner.email}</span>
                    <Badge variant="outline" className="text-xs">Admin</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(owner.email)}
                    disabled={removeOwner.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
