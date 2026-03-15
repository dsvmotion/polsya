import { Outlet } from 'react-router-dom';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <MarketingNav />
      <main className="flex-1">
        <ErrorBoundary section="marketing-page-content">
          <Outlet />
        </ErrorBoundary>
      </main>
      <MarketingFooter />
    </div>
  );
}
