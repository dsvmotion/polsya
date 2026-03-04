/**
 * Submit contact form – public endpoint (no auth required).
 * 1. Validates input
 * 2. Inserts into contact_messages
 * 3. Sends email notification to team via Resend
 * 4. Optionally sends confirmation to submitter
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

    // Send email notification if Resend is configured
    if (resendKey && contactTo) {
      const toList = contactTo.split(',').map((e) => e.trim()).filter(Boolean);
      const subjectLabel = subject || 'General inquiry';
      const html = `
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        <p><strong>Subject:</strong> ${subjectLabel}</p>
        <hr />
        <pre style="white-space: pre-wrap; font-family: sans-serif;">${message}</pre>
        <hr />
        <p><small>Submitted at ${row?.created_at ?? new Date().toISOString()} | ID: ${row?.id ?? ''}</small></p>
      `;

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
        console.error('Resend error:', res.status, errBody);
        // Don't fail the request – message was saved. Log for debugging.
      }
    } else {
      console.warn('Contact form: RESEND_API_KEY or CONTACT_FORM_TO not set – no email sent');
    }

    return jsonResponse(
      { ok: true, message: 'Message sent successfully' },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error('submit-contact error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal error' },
      500,
      corsHeaders
    );
  }
});
