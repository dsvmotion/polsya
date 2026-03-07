import { createContext, useContext } from 'react';
import type React from 'react';

export interface CreativeLayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  contextPanelContent: React.ReactNode | null;
  setContextPanelContent: (content: React.ReactNode | null) => void;
}

export const CreativeLayoutContext = createContext<CreativeLayoutContextType | undefined>(undefined);

export function useCreativeLayout() {
  const ctx = useContext(CreativeLayoutContext);
  if (!ctx) throw new Error('useCreativeLayout must be used within CreativeLayout');
  return ctx;
}
