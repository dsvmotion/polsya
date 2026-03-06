import { Mail, Paperclip, Star } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useCreativeEmails } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface EntityEmailSectionProps {
  entityType: string;
  entityId: string;
}

export function EntityEmailSection({ entityType, entityId }: EntityEmailSectionProps) {
  const { data: emails = [], isLoading } = useCreativeEmails({
    entityType,
    entityId,
    limit: 20,
  });

  return (
    <CollapsibleEngineSection
      icon={Mail}
      label="Emails"
      count={emails.length}
      isLoading={isLoading}
    >
      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No linked emails.</p>
      ) : (
        <div className="divide-y">
          {emails.map((email) => {
            const dirColors = EMAIL_DIRECTION_COLORS[email.direction];
            return (
              <div key={email.id} className="py-2 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm truncate font-medium">
                      {email.subject || '(No subject)'}
                    </span>
                    <Badge variant="outline" className={`text-xs ${dirColors.bg} ${dirColors.text}`}>
                      {EMAIL_DIRECTION_LABELS[email.direction]}
                    </Badge>
                    {email.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleEngineSection>
  );
}
