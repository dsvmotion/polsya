import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/brand';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Discover', href: '/product#discover' },
      { label: 'Enrich', href: '/product#enrich' },
      { label: 'Pipeline', href: '/product#pipeline' },
      { label: 'Analytics', href: '/product#analytics' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Agencies', href: '/use-cases#agencies' },
      { label: 'Brands', href: '/use-cases#brands' },
      { label: 'Producers', href: '/use-cases#producers' },
      { label: 'Recruiters', href: '/use-cases#recruiters' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/resources' },
      { label: 'Blog', href: '/resources#blog' },
      { label: 'Changelog', href: '/resources#changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/privacy#cookies' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-gray-900">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-display text-lg font-semibold text-gray-900">{APP_NAME}</span>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
