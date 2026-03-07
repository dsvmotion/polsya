import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/product', label: 'Product' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/use-cases', label: 'Use cases' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/resources', label: 'Resources' },
];

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:opacity-80 transition-opacity">
          <img src="/polsya-logo.png" alt={APP_NAME} className="h-7 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
          <span className="font-display text-xl">{APP_NAME}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 border-0 shadow-md shadow-indigo-200/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
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
