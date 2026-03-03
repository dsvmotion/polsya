import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import {
  Send,
  Loader2,
  Trash2,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAiChat, useAiChatMessages, type ChatMessage } from '@/hooks/useAiChat';
import { cn } from '@/lib/utils';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2 px-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed',
          isUser
            ? 'bg-gray-900 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md',
          message.isStreaming && 'animate-pulse',
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div
          className={cn(
            'text-[10px] mt-1',
            isUser ? 'text-gray-400' : 'text-gray-500',
          )}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5 text-gray-600" />
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

export function AiChatPanel() {
  const { data: messages = [], isLoading: messagesLoading } = useAiChatMessages();
  const { sendMessage, clearHistory, isLoading: isSending, error } = useAiChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
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
    if (isOpen) scrollToBottom();
  }, [allMessages.length, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

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
    const optimisticAssistant: ChatMessage = {
      id: `opt-assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Thinking...',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };
    setLocalMessages([optimisticUser, optimisticAssistant]);
    scrollToBottom();

    const reply = await sendMessage(text);

    if (reply) {
      setLocalMessages([]);
    } else {
      setLocalMessages([
        optimisticUser,
        {
          ...optimisticAssistant,
          content: error || 'Something went wrong. Please try again.',
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
    await clearHistory();
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
            'bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
            'flex items-center justify-center transition-all duration-200',
            'hover:scale-105 hover:shadow-xl active:scale-95',
          )}
          title="Open AI Sales Assistant"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 flex flex-col bg-white border border-gray-200 shadow-2xl transition-all duration-300',
            isExpanded
              ? 'inset-4 rounded-2xl'
              : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] rounded-2xl',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Sales Assistant</h3>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Private to your workspace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {allMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleClearHistory}
                  title="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0">
            <ScrollArea ref={scrollRef} className="h-full">
              <div className="py-4 space-y-4">
                {messagesLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Loading conversation...</span>
                  </div>
                )}

                {!messagesLoading && allMessages.length === 0 && (
                  <div className="px-4 space-y-4">
                    <div className="flex gap-2 justify-start px-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[85%] text-sm bg-gray-100 text-gray-900 leading-relaxed">
                        Hi! I'm your sales assistant. I can see your workspace data and help you analyze your pipeline, prioritize leads, plan follow-ups, and improve your sales process. What can I help you with?
                      </div>
                    </div>
                    <div className="px-3 space-y-2">
                      <p className="text-xs text-gray-400 font-medium px-1">Try asking</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleSuggestedPrompt(prompt)}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {allMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {error && !isSending && (
                  <div className="px-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your sales data..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm bg-white border-gray-200 rounded-xl focus-visible:ring-blue-500"
                rows={1}
                disabled={isSending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                size="sm"
                className="h-10 w-10 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">
              Shift+Enter for new line. Your data is private and never shared.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
