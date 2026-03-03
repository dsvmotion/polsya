import { useAuth } from '@/contexts/AuthContext';
import { AiChatPanel } from './AiChatPanel';

export function AiChatFab() {
  const { user } = useAuth();
  if (!user) return null;
  return <AiChatPanel />;
}
