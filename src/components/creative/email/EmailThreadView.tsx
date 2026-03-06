import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreativeEmailThread } from '@/hooks/useCreativeEmails';
import {
  EMAIL_DIRECTION_LABELS,
  EMAIL_DIRECTION_COLORS,
} from '@/types/creative-emails';
import type { CreativeEmail } from '@/types/creative-emails';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailThreadViewProps {
  email: CreativeEmail;
  onBack: () => void;
  onReply: (email: CreativeEmail) => void;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function formatThreadSubject(
  emails: Array<{ subject: string | null }>,
): string {
  for (const email of emails) {
    if (email.subject !== null) {
      return email.subject;
    }
  }
  return '(No subject)';
}

export function getParticipants(
  emails: Array<{ fromAddress: string; fromName: string | null }>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const email of emails) {
    const key = email.fromAddress.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(email.fromName ?? email.fromAddress);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal: single message card
// ---------------------------------------------------------------------------

interface MessageCardProps {
  message: CreativeEmail;
  expanded: boolean;
  onToggle: () => void;
}

function MessageCard({ message, expanded, onToggle }: MessageCardProps) {
  const directionColors = EMAIL_DIRECTION_COLORS[message.direction];
  const directionLabel = EMAIL_DIRECTION_LABELS[message.direction];
  const formattedDate = format(new Date(message.sentAt), 'MMM d, yyyy h:mm a');

  const toLine = message.toAddresses
    .map((a) => a.name ?? a.email)
    .join(', ');

  const ccLine = message.ccAddresses
    .map((a) => a.name ?? a.email)
    .join(', ');

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-medium truncate">
            {message.fromName ?? message.fromAddress}
          </span>
          <Badge
            className={`${directionColors.bg} ${directionColors.text} border-0`}
          >
            {directionLabel}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && message.snippet && (
            <span className="hidden text-sm text-muted-foreground truncate max-w-[200px] sm:inline">
              {message.snippet}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-2">
          {toLine && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">To:</span> {toLine}
            </p>
          )}
          {ccLine && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">CC:</span> {ccLine}
            </p>
          )}
          <div className="text-sm whitespace-pre-wrap pt-1">
            {message.bodyText ?? message.snippet ?? ''}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailThreadView({
  email,
  onBack,
  onReply,
}: EmailThreadViewProps) {
  const hasThread = !!email.threadId;

  const threadQuery = useCreativeEmailThread(hasThread ? email.threadId : null);

  // When there is no threadId, treat the single email as the thread
  const messages: CreativeEmail[] = useMemo(() => {
    if (!hasThread) return [email];
    return threadQuery.data ?? [email];
  }, [hasThread, threadQuery.data, email]);

  const isLoading = hasThread && threadQuery.isLoading;

  // Last message is expanded by default; collapse the rest
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set<string>([email.id]);
  });

  // When thread data loads, expand only the last message
  const lastMessageId = messages[messages.length - 1]?.id;

  // Ensure the last message from loaded thread data is expanded
  useMemo(() => {
    if (lastMessageId && !expandedIds.has(lastMessageId)) {
      setExpandedIds(new Set([lastMessageId]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessageId]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const subject = formatThreadSubject(messages);
  const participants = getParticipants(messages);
  const lastEmail = messages[messages.length - 1];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-1">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <h2 className="text-lg font-semibold">{subject}</h2>

        <p className="text-sm text-muted-foreground">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          {' \u00b7 '}
          {participants.join(', ')}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading thread...</p>
      )}

      {/* Messages list */}
      {!isLoading && (
        <div className="space-y-2">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              expanded={expandedIds.has(msg.id)}
              onToggle={() => toggleExpanded(msg.id)}
            />
          ))}
        </div>
      )}

      {/* Footer: Reply button */}
      {!isLoading && lastEmail && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => onReply(lastEmail)}>
            <Reply className="mr-1 h-4 w-4" />
            Reply
          </Button>
        </div>
      )}
    </div>
  );
}
