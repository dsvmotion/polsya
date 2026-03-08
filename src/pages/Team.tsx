import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { canManageWorkspace } from '@/lib/rbac';

const roleColors: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-destructive/10 text-destructive',
  manager: 'bg-warning/10 text-warning',
  member: 'bg-muted text-muted-foreground',
  viewer: 'bg-secondary text-secondary-foreground',
};

export default function Team() {
  const { user } = useAuth();
  const { organization, membership } = useCurrentOrganization();
  const isManager = canManageWorkspace(membership?.role ?? null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentMember = useMemo(() => ({
    id: user?.id ?? '',
    name: user?.user_metadata?.full_name ?? 'You',
    email: user?.email ?? '',
    role: membership?.role ?? 'member',
    joinedAt: user?.created_at ?? new Date().toISOString(),
    avatarInitials: user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U',
  }), [user, membership]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviteDialogOpen(false);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/signup?org=${organization?.id ?? ''}`);
    setCopied(true);
    toast.success('Invite link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace members and their roles.
          </p>
        </div>
        {isManager && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === 'admin' && 'Full access to all features and settings.'}
                    {inviteRole === 'manager' && 'Can manage entities, integrations, and team.'}
                    {inviteRole === 'member' && 'Standard access to entities and operations.'}
                    {inviteRole === 'viewer' && 'Read-only access to dashboards and reports.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            Workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{organization?.name ?? 'My Workspace'}</p>
              <p className="text-sm text-muted-foreground">
                Organization ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{organization?.id?.slice(0, 8)}...</code>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy invite link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <div className="flex items-center gap-4 py-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {currentMember.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{currentMember.name}</p>
                  <Badge variant="outline" className="text-[10px] px-1.5">You</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{currentMember.email}</p>
              </div>
              <Badge className={roleColors[currentMember.role] ?? roleColors.member}>
                {currentMember.role}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  Joined {new Date(currentMember.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {!isManager && (
            <p className="text-xs text-muted-foreground mt-4">
              Contact your workspace admin to manage team members.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Permission</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Admin</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Manager</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { perm: 'View dashboard & reports', admin: true, manager: true, member: true, viewer: true },
                  { perm: 'Manage entities', admin: true, manager: true, member: true, viewer: false },
                  { perm: 'Prospecting & search', admin: true, manager: true, member: true, viewer: false },
                  { perm: 'Manage integrations', admin: true, manager: true, member: false, viewer: false },
                  { perm: 'Manage team members', admin: true, manager: true, member: false, viewer: false },
                  { perm: 'Manage billing', admin: true, manager: false, member: false, viewer: false },
                  { perm: 'Workspace settings', admin: true, manager: true, member: false, viewer: false },
                ].map((row) => (
                  <tr key={row.perm}>
                    <td className="py-2.5 pr-4">{row.perm}</td>
                    <td className="text-center py-2.5">{row.admin ? '✓' : '—'}</td>
                    <td className="text-center py-2.5">{row.manager ? '✓' : '—'}</td>
                    <td className="text-center py-2.5">{row.member ? '✓' : '—'}</td>
                    <td className="text-center py-2.5">{row.viewer ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
