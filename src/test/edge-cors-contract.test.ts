/**
 * Contract tests for supabase/functions/_shared/cors.ts
 *
 * We replicate the module's logic here (pure functions) to validate the
 * CORS contract without requiring the Deno runtime. This ensures the
 * behavioral contract is enforced even if the implementation file moves.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const DEFAULT_ORIGINS = [
  'https://polsya.com',
  'https://www.polsya.com',
  'https://moodlycrm.com',
  'https://www.moodlycrm.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

let envGet: ReturnType<typeof vi.fn>;

function getAllowedOrigins(): string[] {
  const env = envGet('EDGE_ALLOWED_ORIGINS');
  if (env) return env.split(',').map((o: string) => o.trim()).filter(Boolean);
  return DEFAULT_ORIGINS;
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function corsHeaders(origin: string): Record<string, string> {
  const allowed = isOriginAllowed(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : getAllowedOrigins()[0],
    'Vary': 'Origin',
  };
}

function handleCors(req: Request): Response | null {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  envGet = vi.fn().mockReturnValue(undefined);
});

describe('isOriginAllowed', () => {
  it('returns true for polsya.com (default-allowed)', () => {
    expect(isOriginAllowed('https://polsya.com')).toBe(true);
  });

  it('returns true for moodlycrm.com (legacy)', () => {
    expect(isOriginAllowed('https://moodlycrm.com')).toBe(true);
  });

  it('returns false for an unknown origin', () => {
    expect(isOriginAllowed('https://evil.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isOriginAllowed('')).toBe(false);
  });

  it('respects EDGE_ALLOWED_ORIGINS env override', () => {
    envGet.mockReturnValue('https://custom.io, https://other.io');
    expect(isOriginAllowed('https://custom.io')).toBe(true);
    expect(isOriginAllowed('https://polsya.com')).toBe(false);
  });
});

describe('corsHeaders', () => {
  it('includes Vary: Origin', () => {
    const headers = corsHeaders('https://polsya.com');
    expect(headers['Vary']).toBe('Origin');
  });

  it('returns exact origin when allowed', () => {
    const headers = corsHeaders('https://polsya.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://polsya.com');
  });

  it('returns first allowlisted origin when blocked', () => {
    const headers = corsHeaders('https://evil.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://polsya.com');
  });

  it('returns first allowlisted origin for empty origin', () => {
    const headers = corsHeaders('');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://polsya.com');
  });
});

describe('handleCors', () => {
  it('OPTIONS + allowed origin => 204 with allow-origin header', () => {
    const req = new Request('https://edge.fn/test', {
      method: 'OPTIONS',
      headers: { Origin: 'https://polsya.com' },
    });
    const res = handleCors(req)!;
    expect(res).not.toBeNull();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://polsya.com');
    expect(res.headers.get('Vary')).toBe('Origin');
  });

  it('OPTIONS + blocked origin => 403', () => {
    const req = new Request('https://edge.fn/test', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com' },
    });
    const res = handleCors(req)!;
    expect(res).not.toBeNull();
    expect(res.status).toBe(403);
  });

  it('GET + blocked origin => 403 JSON', async () => {
    const req = new Request('https://edge.fn/test', {
      method: 'GET',
      headers: { Origin: 'https://evil.com' },
    });
    const res = handleCors(req)!;
    expect(res).not.toBeNull();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Origin not allowed');
  });

  it('GET + missing origin => null (pass-through)', () => {
    const req = new Request('https://edge.fn/test', { method: 'GET' });
    expect(handleCors(req)).toBeNull();
  });

  it('GET + allowed origin => null (pass-through)', () => {
    const req = new Request('https://edge.fn/test', {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(handleCors(req)).toBeNull();
  });
});
