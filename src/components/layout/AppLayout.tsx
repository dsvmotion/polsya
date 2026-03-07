import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { CommandPalette } from './CommandPalette';
import { AiChatSheet } from './AiChatSheet';
import { SubscriptionBanner } from '@/components/auth/SubscriptionBanner';
import { ActivateSubscriptionGate } from '@/components/auth/ActivateSubscriptionGate';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { cn } from '@/lib/utils';
import { LayoutContext } from './app-layout-context';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }}>
      <div className="min-h-screen bg-background">
        <AppSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onOpenAiChat={() => setAiChatOpen(true)}
        />

        <div
          className={cn(
            'flex flex-col min-h-screen transition-all duration-300',
            sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64',
          )}
        >
          <AppTopBar
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => setCommandOpen(true)}
          />
          <ImpersonationBanner />
          <SubscriptionBanner />
          <main className="flex-1">
            <ActivateSubscriptionGate />
          </main>
        </div>

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        <AiChatSheet open={aiChatOpen} onOpenChange={setAiChatOpen} />
      </div>
    </LayoutContext.Provider>
  );
}
