# Contact Form Email Setup

The contact form (and demo request flow) sends email notifications to the team via [Resend](https://resend.com).

## Prerequisites

1. Create a [Resend](https://resend.com) account
2. Verify your domain (e.g. `polsya.com`) or use the Resend sandbox domain for testing
3. Create an API key in Resend Dashboard → API Keys

### Hostinger + Resend

If your domain is hosted on Hostinger and you want to send from an email like `noreply@tudominio.com`:

1. In [Resend Dashboard](https://resend.com/domains) → Domains → Add Domain
2. Add your domain (e.g. `polsya.com`)
3. Resend will show DNS records (SPF, DKIM). Add them in **Hostinger** → Hosting → DNS Zone
4. Wait for Resend to verify the domain (usually a few minutes)
5. Use `Polsya <noreply@tudominio.com>` as `CONTACT_FROM`

**Testing without domain verification**: Use Resend sandbox `onboarding@resend.dev` as sender – emails only go to the email of your Resend account.

## Supabase Edge Function Secrets

Configure these secrets in your Supabase project (Dashboard → Project Settings → Edge Functions → Secrets, or via `supabase secrets set`):

| Secret | Description | Status |
|--------|-------------|--------|
| `RESEND_API_KEY` | Resend API key | ✅ Usually already set |
| `CONTACT_FORM_TO` | Email(s) to receive form submissions (comma-separated) | ⚠️ **Required** |
| `CONTACT_FROM` | Sender (must be verified in Resend) | ⚠️ **Required** |

**Commands** (replace with your actual values):

```bash
supabase secrets set CONTACT_FORM_TO="tu-email@ejemplo.com"
supabase secrets set CONTACT_FROM="Polsya <noreply@tudominio.com>"
```

## Deploy the Edge Function

```bash
supabase functions deploy submit-contact
```

Or deploy all functions:

```bash
supabase functions deploy
```

## Testing

1. Visit `/contact` on your site
2. Fill and submit the form
3. Check that:
   - The success message appears
   - An email arrives at the address(es) in `CONTACT_FORM_TO`
4. Demo requests (from landing page) use the same flow with `subject=demo`

## Troubleshooting

- **No email received**: Check Supabase Edge Function logs (Dashboard → Edge Functions → submit-contact → Logs)
- **Resend error**: Verify `RESEND_API_KEY` is correct and the domain is verified in Resend
- **403 Origin not allowed**: Add your deployment URL to `EDGE_ALLOWED_ORIGINS` in Supabase secrets (comma-separated)

## Optional: Confirmation Email to Submitter

To send an automatic confirmation to the person who submitted the form, extend the `submit-contact` edge function to call Resend a second time with a "Thanks for contacting us" template, using their email as the recipient.
