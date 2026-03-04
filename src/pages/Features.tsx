import { Link } from 'react-router-dom';
import {
  Search,
  ClipboardList,
  Plug,
  Sparkles,
  BarChart3,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    id: 'prospecting',
    title: 'Prospecting',
    icon: Search,
    description: 'Find and qualify leads with powerful filters, maps, and search.',
    bullets: ['Entity types (pharmacies, clients, distributors)', 'Interactive map with clustering', 'Territory planning and assignment', 'Advanced filters and bulk actions'],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: ClipboardList,
    description: 'Manage daily operations, orders, and workflows in one place.',
    bullets: ['Order tracking and management', 'Delivery schedules', 'Activity logging', 'Document attachments'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Plug,
    description: 'Connect your existing tools. Data flows in and out seamlessly.',
    bullets: ['WooCommerce (orders, products)', 'Gmail & Outlook (email sync)', 'Google Maps (geocoding, maps)', 'More coming: Notion, Slack, HubSpot'],
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    icon: Sparkles,
    description: 'Ask questions about your pipeline. Get insights and recommendations.',
    bullets: ['Natural language queries', 'Pipeline analysis', 'Lead prioritization', 'Private to your workspace'],
  },
  {
    id: 'maps',
    title: 'Maps & Territory',
    icon: MapPin,
    description: 'Visualize your territory. Plan visits and optimize routes.',
    bullets: ['Google Maps integration', 'Cluster by status or type', 'Custom markers and layers', 'Embedded in prospecting and operations'],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    description: 'Pipeline metrics, conversion rates, and activity summaries.',
    bullets: ['Dashboard widgets', 'Export to Excel', 'Team activity reports', 'Custom date ranges'],
  },
  {
    id: 'team',
    title: 'Team',
    icon: Users,
    description: 'Invite team members. Assign roles and permissions.',
    bullets: ['Admin, manager, rep, ops roles', 'Organization-level access', 'Audit and activity logs', 'Invite via email'],
  },
];

export default function Features() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Everything you need to sell smarter
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Prospecting, operations, integrations, AI, and reporting—built for teams that sell to pharmacies, distributors, and B2B accounts.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature) => (
            <section
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24"
            >
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
                    {feature.title}
                  </h2>
                  <p className="mt-4 text-muted-foreground">{feature.description}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-8 flex items-center justify-center min-h-[200px]">
                  <span className="text-sm text-muted-foreground">Feature demo placeholder</span>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Button size="lg" asChild>
            <Link to="/signup">
              Start your free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
