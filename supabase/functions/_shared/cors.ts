const DEFAULT_ORIGINS = [
  'https://moodlycrm.com',
  'https://www.moodlycrm.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getAllowedOrigins(): string[] {
  const env = Deno.env.get('EDGE_ALLOWED_ORIGINS');
  if (env) {
    return env.split(',').map(o => o.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

export function corsHeaders(origin: string): Record<string, string> {
  const allowed = isOriginAllowed(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : getAllowedOrigins()[0],
    'Vary': 'Origin',
  };
}

export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('Origin') || '';

  if (req.method === 'OPTIONS') {
    if (!isOriginAllowed(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-organization-id',
        'Vary': 'Origin',
      },
    });
  }

  if (origin && !isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Vary': 'Origin' },
    });
  }

  return null;
}
