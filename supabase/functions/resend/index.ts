Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'missing RESEND_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json() // { to, subject, html, text, from? }
    const payload: Record<string, unknown> = {
      from: body.from ?? 'no-reply@example.com', // cambia por tu remitente verificado en Resend
      to: Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject ?? 'No subject',
    }
    if (body.html) payload.html = body.html
    if (body.text) payload.text = body.text

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    return new Response(
      JSON.stringify(data),
      { status: res.status, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
