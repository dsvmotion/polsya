import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { CookieBanner } from '@/components/landing/CookieBanner';

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/trust', label: 'Trust' },
  { href: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/contact?subject=demo">Request demo</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup?plan=starter">Get started</Link>
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/contact?subject=demo" onClick={() => setMobileMenuOpen(false)}>Request demo</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/signup?plan=starter" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link to="/features#integrations" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
                <li><Link to="/#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
                <li><Link to="/contact?subject=demo" className="text-sm text-muted-foreground hover:text-foreground">Request demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Trust & Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/trust" className="text-sm text-muted-foreground hover:text-foreground">Trust Center</Link></li>
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/features" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link to="/#pricing-preview" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Newsletter</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get the latest updates in your inbox.</p>
              <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">Subscribe</Button>
              </form>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
