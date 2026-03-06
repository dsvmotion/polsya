import { useState } from 'react';
import { Mail, Send, RefreshCw, Star, Paperclip } from 'lucide-react';
import { WorkspaceContainer } from '@/components/creative/shared/WorkspaceContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreativeEmails } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import type { CreativeEmail, EmailDirection } from '@/types/creative-emails';
import { formatDistanceToNow } from 'date-fns';

export default function CreativeInbox() {
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');

  const directionFilter: EmailDirection | undefined =
    activeTab === 'all' ? undefined : activeTab;

  const { data: emails = [], isLoading } = useCreativeEmails({
    direction: directionFilter,
    limit: 100,
  });

  return (
    <WorkspaceContainer
      title="Email"
      subtitle={`${emails.length} messages`}
      icon={Mail}
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="inbound">Received</TabsTrigger>
            <TabsTrigger value="outbound">Sent</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>No emails synced yet.</p>
            <p className="text-sm">Connect a Gmail or Outlook account in Integrations to start syncing.</p>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <EmailRow key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceContainer>
  );
}

function EmailRow({ email }: { email: CreativeEmail }) {
  const dirColors = EMAIL_DIRECTION_COLORS[email.direction];

  return (
    <div
      className={`flex items-start gap-3 py-3 px-2 hover:bg-muted/50 rounded cursor-pointer ${
        !email.isRead ? 'font-semibold' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm truncate">
            {email.direction === 'inbound'
              ? email.fromName || email.fromAddress
              : email.toAddresses.map((a) => a.name || a.email).join(', ')}
          </span>
          <Badge variant="outline" className={`text-xs ${dirColors.bg} ${dirColors.text}`}>
            {EMAIL_DIRECTION_LABELS[email.direction]}
          </Badge>
          {email.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
          {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
        </div>
        <p className="text-sm truncate">{email.subject || '(No subject)'}</p>
        <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
      </span>
    </div>
  );
}
