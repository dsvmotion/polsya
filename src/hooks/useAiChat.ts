import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ChatSource {
  title: string;
  documentId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

export function useAiChatMessages() {
  const { organization } = useCurrentOrganization();
  const { user } = useAuth();
  const orgId = organization?.id ?? null;
  const userId = user?.id ?? null;

  return useQuery<ChatMessage[]>({
    queryKey: ['ai-chat-messages', orgId, userId],
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('id, role, content, created_at')
        .eq('organization_id', orgId!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw new Error(error.message);
      return (data ?? []).map((m) => ({
        id: m.id,
        role: m.role as ChatMessage['role'],
        content: m.content,
        createdAt: m.created_at,
      }));
    },
    staleTime: 30_000,
  });
}

export function useAiChat() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;
  const qc = useQueryClient();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    context?: Record<string, unknown>,
  ): Promise<{ reply: string; sources?: ChatSource[] } | null> => {
    if (!orgId) {
      setError('No organization context');
      return null;
    }

    setIsLoading(true);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat-proxy`, {
        method: 'POST',
        headers,
        signal: abortRef.current.signal,
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = body.error ?? 'AI request failed';
        setError(msg);
        return null;
      }

      const data = await response.json();
      const reply = data?.reply;
      if (!reply) {
        setError('Empty response from AI');
        return null;
      }

      qc.invalidateQueries({ queryKey: ['ai-chat-messages', orgId, user?.id] });
      qc.invalidateQueries({ queryKey: ['ai-usage', orgId] });
      return { reply, sources: data.sources };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null;
      const msg = getErrorMessage(err);
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [orgId, qc, user?.id]);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(async () => {
    if (!orgId || !user?.id) return;

    const { error: deleteError } = await supabase
      .from('ai_chat_messages')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ['ai-chat-messages', orgId, user.id] });
  }, [orgId, user?.id, qc]);

  return { sendMessage, cancelRequest, clearHistory, isLoading, error };
}
