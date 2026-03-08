import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, ChevronDown, Sparkles, Database, GitBranch,
  Zap, Target, Layers, Network, Users, BookOpen,
  FileText, Building2, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Mega menu data ─── */
type MenuItem = { icon: React.ElementType; title: string; description: string; href: string };
type MegaMenuConfig = { columns: number; items: MenuItem[] };

const megaMenuData: Record<string, MegaMenuConfig> = {
  product: {
    columns: 2,
    items: [
      { icon: Sparkles, title: 'Discover', description: 'Find creative talent across 2.8M+ profiles', href: '/product#discover' },
      { icon: Database, title: 'Enrich', description: 'Auto-enrich from 50+ data sources', href: '/product#enrich' },
      { icon: GitBranch, title: 'Connect', description: 'Map creative-brand-agency relationships', href: '/product#connect' },
      { icon: Layers, title: 'Pipeline', description: 'Manage creative partnerships end-to-end', href: '/product#pipeline' },
      { icon: Network, title: 'Integrations', description: 'Connect with your existing creative tools', href: '/integrations' },
    ],
  },
  'use-cases': {
    columns: 2,
    items: [
      { icon: Building2, title: 'Agencies', description: 'Scale your creative sourcing', href: '/use-cases#agencies' },
      { icon: Briefcase, title: 'Brands', description: 'Find creatives that match your vision', href: '/use-cases#brands' },
      { icon: Users, title: 'Studios', description: 'Build your talent network', href: '/use-cases#studios' },
      { icon: Target, title: 'Recruiters', description: 'Source creative professionals faster', href: '/use-cases#recruiters' },
    ],
  },
  resources: {
    columns: 1,
    items: [
      { icon: BookOpen, title: 'Blog', description: 'Insights on creative intelligence', href: '/resources' },
      { icon: FileText, title: 'Documentation', description: 'Technical guides and API docs', href: '/resources' },
      { icon: Zap, title: 'Changelog', description: 'Latest product updates', href: '/resources' },
    ],
  },
};

const navItems: { label: string; key?: string; href?: string }[] = [
  { label: 'Product', key: 'product' },
  { label: 'Use Cases', key: 'use-cases' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', key: 'resources' },
];

/* ─── Mega Menu Panel ─── */
function MegaMenuPanel({ config, onClose }: { config: MegaMenuConfig; onClose: () => void }) {
  return (
    <div
      className="animate-mega-menu-slide"
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className={cn(
        'grid gap-1 p-4',
        config.columns === 3 && 'grid-cols-3',
        config.columns === 2 && 'grid-cols-2',
        config.columns === 1 && 'grid-cols-1 max-w-xs',
      )}>
        {config.items.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            onClick={onClose}
            className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 flex items-center justify-center shrink-0 group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
              <item.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Mobile Accordion Section ─── */
function MobileAccordion({ label, config, onClose }: { label: string; config: MegaMenuConfig; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pl-3 pb-2 space-y-0.5">
          {config.items.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            >
              <item.icon className="h-3.5 w-3.5 text-indigo-500" />
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Nav ─── */
export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavEnter = useCallback((key: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setActiveMenu(key);
  }, []);

  const handleNavLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 200);
  }, []);

  const handlePanelEnter = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  const handlePanelLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 200);
  }, []);

  const closeMega = useCallback(() => setActiveMenu(null), []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
          <img src="/polsya-logo-black.png" alt="Polsya" className="h-16 w-auto" onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            // Show text fallback next to the hidden image
            const fallback = document.createElement('span');
            fallback.textContent = 'Polsya';
            fallback.className = 'text-xl font-bold text-gray-900';
            img.parentElement?.appendChild(fallback);
          }} />
        </Link>

        {/* ── Center nav (desktop) ── */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) =>
            item.key ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleNavEnter(item.key as string)}
                onMouseLeave={handleNavLeave}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    activeMenu === item.key
                      ? 'text-gray-900 bg-gray-100/60'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn(
                    'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                    activeMenu === item.key && 'rotate-180'
                  )} />
                </button>
              </div>
            ) : (
              <Link
                key={item.label}
                to={item.href ?? '/'}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* ── Right actions (desktop) ── */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="text-gray-600 hover:text-gray-900">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 border-0 shadow-md shadow-indigo-200/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mega menu dropdown (desktop) ── */}
      {activeMenu && megaMenuData[activeMenu] && (
        <div
          className="hidden lg:block absolute left-0 right-0 z-40"
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/5 -z-10" onClick={closeMega} />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
              <MegaMenuPanel config={megaMenuData[activeMenu]} onClose={closeMega} />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) =>
            item.key && megaMenuData[item.key] ? (
              <MobileAccordion
                key={item.label}
                label={item.label}
                config={megaMenuData[item.key]}
                onClose={() => setMobileMenuOpen(false)}
              />
            ) : (
              <Link
                key={item.label}
                to={item.href || '/'}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" asChild className="w-full">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            </Button>
            <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
