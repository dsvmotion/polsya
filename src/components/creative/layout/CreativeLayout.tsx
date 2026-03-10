import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CreativeSidebar } from './CreativeSidebar';
import { CreativeTopBar } from './CreativeTopBar';
import { ContextPanel } from './ContextPanel';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AiChatSheet } from '@/components/layout/AiChatSheet';
import { SubscriptionBanner } from '@/components/auth/SubscriptionBanner';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { cn } from '@/lib/utils';
import { CreativeLayoutContext } from './useCreativeLayout';

export function CreativeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [contextPanelContent, setContextPanelContent] = useState<React.ReactNode | null>(null);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // CMD+K handler
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
    <CreativeLayoutContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        contextPanelOpen,
        setContextPanelOpen,
        contextPanelContent,
        setContextPanelContent,
      }}
    >
      <div className="min-h-screen bg-background">
        <CreativeSidebar
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
          <CreativeTopBar
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => setCommandOpen(true)}
          />
          <ImpersonationBanner />
          <SubscriptionBanner />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              <ErrorBoundary section="page-content">
                <Outlet />
              </ErrorBoundary>
            </main>

            {contextPanelOpen && (
              <ContextPanel
                onClose={() => {
                  setContextPanelOpen(false);
                  setContextPanelContent(null);
                }}
              >
                {contextPanelContent}
              </ContextPanel>
            )}
          </div>
        </div>

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        <AiChatSheet open={aiChatOpen} onOpenChange={setAiChatOpen} />
      </div>
    </CreativeLayoutContext.Provider>
  );
}
