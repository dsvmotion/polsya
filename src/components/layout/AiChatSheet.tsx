import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { logger } from '@/lib/logger';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  AlertCircle,
  Shield,
  Sparkles,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAiChat, useAiChatMessages, type ChatMessage, type ChatSource } from '@/hooks/useAiChat';
import { useAiUsage } from '@/hooks/useAiUsage';
import { cn } from '@/lib/utils';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 px-3 justify-start">
      <div className="w-7 h-7 rounded-full bg-gradient-cta flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2 px-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-cta flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="max-w-[85%]">
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-foreground text-background rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md',
            message.isStreaming && 'animate-pulse',
          )}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <div
            className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-background/70' : 'text-muted-foreground',
            )}
          >
            {formatTime(message.createdAt)}
          </div>
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground">
            <FileText className="h-2.5 w-2.5 shrink-0" />
            <span>Sources: {message.sources.map((s) => s.title).join(', ')}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  'What does my sales pipeline look like?',
  'Which leads should I prioritize this week?',
  'Summarize my recent activity',
  'How can I improve my conversion rate?',
];

interface AiChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiChatSheet({ open, onOpenChange }: AiChatSheetProps) {
  const location = useLocation();
  const { data: messages = [], isLoading: messagesLoading } = useAiChatMessages();
  const { sendMessage, clearHistory, isLoading: isSending, error } = useAiChat();
  const { data: budget } = useAiUsage();

  const creditsExhausted = budget?.remaining !== null && budget?.remaining !== undefined && budget.remaining <= 0;
  const ragEnabled = budget?.aiFeatures?.includes('rag') ?? false;

  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [latestSources, setLatestSources] = useState<ChatSource[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allMessages = [...messages, ...localMessages];

  useEffect(() => {
    setLocalMessages([]);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [open, allMessages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');

    const optimisticUser: ChatMessage = {
      id: `opt-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages([optimisticUser]);
    scrollToBottom();

    try {
      // Pass page context so AI knows where the user is
      const result = await sendMessage(text, { currentPage: location.pathname });

      if (result) {
        setLatestSources(result.sources?.length ? result.sources : null);
        setLocalMessages([]);
      } else {
        setLocalMessages([
          optimisticUser,
          {
            id: `opt-err-${Date.now()}`,
            role: 'assistant',
            content: error || 'Something went wrong. Please try again.',
            createdAt: new Date().toISOString(),
            isStreaming: false,
          },
        ]);
      }
    } catch {
      setLocalMessages([
        optimisticUser,
        {
          id: `opt-err-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
          isStreaming: false,
        },
      ]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    setLocalMessages([]);
    setLatestSources(null);
    try {
      await clearHistory();
    } catch (err) {
      logger.warn('[AiChat] Failed to clear history:', err);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md p-0 gap-0"
        aria-describedby={undefined}
      >
        <SheetHeader className="px-4 py-3 border-b bg-gradient-cta text-white shrink-0 rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white font-semibold">AI Assistant</SheetTitle>
                <p className="text-[10px] text-white/70 flex items-center gap-1 font-normal">
                  <Shield className="h-2.5 w-2.5" />
                  Private to your workspace
                </p>
                {budget && (
                  <p className="text-[10px] text-white/70 flex items-center gap-1 font-normal">
                    <Sparkles className="h-2.5 w-2.5" />
                    {budget.remaining === null ? '\u221E Unlimited' : `Credits: ${budget.remaining} remaining`}
                  </p>
                )}
              </div>
            </div>
            {allMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleClearHistory}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="py-4 space-y-4">
              {messagesLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Loading conversation...</span>
                </div>
              )}

              {!messagesLoading && allMessages.length === 0 && (
                <div className="px-4 space-y-4">
                  <div className="flex gap-2 justify-start px-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-cta flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[85%] text-sm bg-muted text-foreground leading-relaxed">
                      Hi! I'm your AI sales assistant. I can see your workspace data and help you analyze your pipeline, prioritize leads, plan follow-ups, and improve your sales process. What can I help you with?
                    </div>
                  </div>
                  <div className="px-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium px-1">Try asking</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSuggestedPrompt(prompt)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const lastAssistantIdx = allMessages.reduceRight(
                  (found, msg, i) => found === -1 && msg.role === 'assistant' ? i : found,
                  -1,
                );
                return allMessages.map((msg, i) => {
                  const mergedMsg = i === lastAssistantIdx && latestSources?.length
                    ? { ...msg, sources: latestSources }
                    : msg;
                  return <MessageBubble key={msg.id} message={mergedMsg} />;
                });
              })()}

              {isSending && (
                <>
                  <TypingIndicator />
                  {ragEnabled && (
                    <div className="px-12 text-[10px] text-muted-foreground animate-pulse">
                      Searching knowledge base...
                    </div>
                  )}
                </>
              )}

              {error && !isSending && (
                <div className="px-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {creditsExhausted && (
            <div className="px-3 py-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>AI credits exhausted. Upgrade your plan for more.</span>
              </div>
            </div>
          )}

          <div className="p-3 border-t bg-muted/50 shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your sales data..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                rows={1}
                disabled={isSending || creditsExhausted}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending || creditsExhausted}
                size="sm"
                className="h-10 w-10 p-0 shrink-0"
                aria-label={isSending ? "Sending message" : "Send message"}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Shift+Enter for new line. Your data is private and never shared.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
