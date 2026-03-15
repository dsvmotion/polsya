import { type ComponentType } from 'react';
import {
  SiGmail,
  SiWoocommerce,
  SiShopify,
  SiBrevo,
  SiNotion,
  SiGoogledrive,
  SiOpenai,
  SiAnthropic,
  SiHubspot,
  SiSalesforce,
  SiPrestashop,
  SiWhatsapp,
  SiSlack,
  SiSendgrid,
  SiMailchimp,
  SiGooglesheets,
  SiZapier,
  SiIntercom,
  SiZoom,
  SiMailgun,
  SiAirtable,
  SiZendesk,
} from 'react-icons/si';
import { Mail, CircleDot, Plug, Mailbox, TrendingUp, Split } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconProps = { className?: string; style?: React.CSSProperties };

/**
 * Maps each integration provider key to a proper brand icon component.
 * Uses react-icons/si (Simple Icons) for official brand icons, and
 * Lucide for providers without a Simple Icons entry.
 */
const PROVIDER_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  gmail: SiGmail,
  outlook: Mail,          // No SI icon for Outlook; Lucide Mail with brand color
  email_imap: Mailbox,
  woocommerce: SiWoocommerce,
  shopify: SiShopify,
  brevo: SiBrevo,
  notion: SiNotion,
  google_drive: SiGoogledrive,
  openai: SiOpenai,
  anthropic: SiAnthropic,
  hubspot: SiHubspot,
  salesforce: SiSalesforce,
  pipedrive: CircleDot,   // No SI icon; CircleDot with brand color
  prestashop: SiPrestashop,
  whatsapp: SiWhatsapp,
  slack: SiSlack,
  sendgrid: SiSendgrid,
  mailchimp: SiMailchimp,
  google_sheets: SiGooglesheets,
  zapier: SiZapier,
  intercom: SiIntercom,
  zoom: SiZoom,
  mailgun: SiMailgun,
  klaviyo: TrendingUp,      // No SI icon; TrendingUp with brand color
  airtable: SiAirtable,
  zendesk: SiZendesk,
  segment: Split,           // No SI icon; Split with brand color
  custom_api: Plug,
};

/** Brand colors for each provider (used as icon fill/stroke). */
const PROVIDER_COLORS: Record<string, string> = {
  gmail: '#EA4335',
  outlook: '#0078D4',
  email_imap: '#6B7280',
  woocommerce: '#96588A',
  shopify: '#7AB55C',
  brevo: '#0B996E',
  notion: '#000000',
  google_drive: '#4285F4',
  openai: '#412991',
  anthropic: '#D4A27F',
  hubspot: '#FF7A59',
  salesforce: '#00A1E0',
  pipedrive: '#1A1A1A',
  prestashop: '#DF0067',
  whatsapp: '#25D366',
  slack: '#4A154B',
  sendgrid: '#1A82E2',
  mailchimp: '#FFE01B',
  google_sheets: '#0F9D58',
  zapier: '#FF4A00',
  intercom: '#286EFA',
  zoom: '#2D8CFF',
  mailgun: '#F06B66',
  klaviyo: '#24BE74',
  airtable: '#18BFFF',
  zendesk: '#03363D',
  segment: '#52BD94',
  custom_api: '#6B7280',
};

interface ProviderIconProps {
  provider: string;
  className?: string;
  /** Size in pixels. Defaults to 16. */
  size?: number;
  /** Use brand color as icon color. Defaults to true. */
  colored?: boolean;
}

/**
 * Renders the official brand icon for a given integration provider.
 *
 * Usage:
 * ```tsx
 * <ProviderIcon provider="gmail" size={18} />
 * <ProviderIcon provider="woocommerce" colored={false} className="text-muted-foreground" />
 * ```
 */
export function ProviderIcon({
  provider,
  className,
  size = 16,
  colored = true,
}: ProviderIconProps) {
  const IconComponent = PROVIDER_ICON_MAP[provider];

  if (!IconComponent) {
    return <Plug className={cn('shrink-0', className)} style={{ width: size, height: size }} />;
  }

  const color = colored ? PROVIDER_COLORS[provider] : undefined;

  return (
    <IconComponent
      className={cn('shrink-0', className)}
      style={{ width: size, height: size, color }}
    />
  );
}
