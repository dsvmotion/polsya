import { Outlet } from 'react-router-dom';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <MarketingNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
