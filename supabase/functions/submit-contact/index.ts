/**
 * Submit contact form – public endpoint (no auth required).
 * 1. Validates input
 * 2. Inserts into contact_messages
 * 3. Sends email notification to team via Resend
 * 4. Sends confirmation email to submitter
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY       – Resend API key (https://resend.com)
 *   CONTACT_FORM_TO      – Email address(es) to receive notifications (comma-separated)
 *   CONTACT_FROM         – Sender email (e.g. "Polsya <noreply@polsya.com>")
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitize(str: string, maxLen: number): string {
  return String(str ?? '').trim().slice(0, maxLen);
}

/** Escape HTML special chars to prevent injection in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const contactTo = Deno.env.get('CONTACT_FORM_TO') ?? '';
  const contactFrom = Deno.env.get('CONTACT_FROM') ?? 'Polsya <noreply@polsya.com>';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration' }, 500, corsHeaders);
  }

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const name = sanitize(String(body.name ?? ''), 200);
    const email = sanitize(String(body.email ?? ''), 254);
    const company = sanitize(String(body.company ?? ''), 200) || null;
    const subject = sanitize(String(body.subject ?? ''), 100) || null;
    const message = sanitize(String(body.message ?? ''), 5000);

    if (!name || name.length < 2) {
      return jsonResponse({ error: 'Name is required (min 2 characters)' }, 400, corsHeaders);
    }
    if (!email) {
      return jsonResponse({ error: 'Email is required' }, 400, corsHeaders);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400, corsHeaders);
    }
    if (!message || message.length < 10) {
      return jsonResponse({ error: 'Message is required (min 10 characters)' }, 400, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: row, error: insertError } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name,
        email,
        company,
        subject,
        message,
        source: 'contact_page',
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Contact insert error:', insertError);
      return jsonResponse({ error: 'Failed to save message' }, 500, corsHeaders);
    }

    const emailErrors: string[] = [];

    // Send internal notification email to the Polsya team
    if (resendKey && contactTo) {
      const toList = contactTo.split(',').map((e) => e.trim()).filter(Boolean);
      const subjectLabel = subject || 'General inquiry';
      const html = `
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
        <p><strong>Subject:</strong> ${escapeHtml(subjectLabel)}</p>
        <hr />
        <pre style="white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(message)}</pre>
        <hr />
        <p><small>Submitted at ${row?.created_at ?? new Date().toISOString()} | ID: ${row?.id ?? ''}</small></p>
      `;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: contactFrom,
            to: toList,
            reply_to: email,
            subject: `[Polsya Contact] ${subjectLabel} – ${name}`,
            html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('Resend notification error:', res.status, errBody);
          emailErrors.push(`notification: ${res.status}`);
        }
      } catch (notifErr) {
        console.error('Resend notification fetch error:', notifErr);
        emailErrors.push('notification: fetch failed');
      }

      // Send confirmation email to the submitter
      try {
        const confirmHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a;">Thanks for reaching out, ${escapeHtml(name)}!</h2>
            <p style="color: #555; line-height: 1.6;">
              We've received your message and will get back to you within 24 hours.
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #333;">Your message:</p>
              <p style="margin: 0; color: #555; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <p style="color: #555; line-height: 1.6;">
              In the meantime, feel free to explore our platform at
              <a href="https://polsya.com" style="color: #6366f1;">polsya.com</a>.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 13px;">
              This is an automated confirmation from Polsya. Please do not reply to this email.
            </p>
          </div>
        `;

        const confirmRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: contactFrom,
            to: [email],
            subject: `We received your message – Polsya`,
            html: confirmHtml,
          }),
        });

        if (!confirmRes.ok) {
          const errBody = await confirmRes.text();
          console.error('Resend confirmation error:', confirmRes.status, errBody);
          emailErrors.push(`confirmation: ${confirmRes.status}`);
        }
      } catch (confirmErr) {
        console.error('Resend confirmation fetch error:', confirmErr);
        emailErrors.push('confirmation: fetch failed');
      }
    } else {
      console.warn('Contact form: RESEND_API_KEY or CONTACT_FORM_TO not set – no email sent');
      emailErrors.push('missing RESEND_API_KEY or CONTACT_FORM_TO');
    }

    return jsonResponse(
      {
        ok: true,
        message: 'Message sent successfully',
        ...(emailErrors.length > 0 ? { emailWarnings: emailErrors } : {}),
      },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error('submit-contact error:', err);
    return jsonResponse(
      { error: 'Failed to process your message. Please try again later.' },
      500,
      corsHeaders
    );
  }
});
