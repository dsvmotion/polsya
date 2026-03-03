import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const cors = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'geocode_entities',
    allowedRoles: ['admin', 'ops'],
    allowlistEnvKey: 'GEOCODE_ALLOWED_USER_IDS',
    corsHeaders: cors,
  });
  if (!auth.ok) return auth.response;

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const billing = await requireBillingAccessForOrg(supabase, auth.organizationId, {
      action: 'geocode_entities',
      corsHeaders: cors,
    });
    if (!billing.ok) return billing.response;
    const organizationId = auth.organizationId;

    const { batchSize = 100, clientType, entityTypeKey } = await req.json().catch(() => ({}));

    // Use the entities table; fall back to pharmacies view when no entityTypeKey specified
    const tableName = entityTypeKey ? 'entities' : 'pharmacies';

    let query = supabase
      .from(tableName)
      .select('id, name, address, city, province, postal_code, country')
      .eq('organization_id', organizationId)
      .or('lat.is.null,lat.eq.0')
      .limit(batchSize);

    if (entityTypeKey) {
      query = query.eq('entity_type_key', entityTypeKey);
    }

    if (clientType) {
      query = query.eq('client_type', clientType);
    }

    const { data: entities, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No entities to geocode', remaining: 0 }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let geocoded = 0;
    let errors = 0;
    const results: Record<string, unknown>[] = [];

    for (const entity of entities) {
      try {
        const parts = [
          entity.address,
          entity.city,
          entity.postal_code,
          entity.province,
          entity.country || 'Spain',
        ].filter(Boolean);
        const addressStr = parts.join(', ');

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;

          const { error: updateError } = await supabase
            .from(tableName)
            .update({ lat: location.lat, lng: location.lng })
            .eq('id', entity.id)
            .eq('organization_id', organizationId);

          if (updateError) {
            errors++;
            results.push({ id: entity.id, name: entity.name, error: updateError.message });
          } else {
            geocoded++;
            results.push({ id: entity.id, name: entity.name, lat: location.lat, lng: location.lng });
          }
        } else {
          errors++;
          results.push({ id: entity.id, name: entity.name, error: `Geocoding failed: ${data.status}` });
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        errors++;
        results.push({ id: entity.id, name: entity.name, error: String(err) });
      }
    }

    // Count remaining un-geocoded entities
    let remainingQuery = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .or('lat.is.null,lat.eq.0');

    if (entityTypeKey) {
      remainingQuery = remainingQuery.eq('entity_type_key', entityTypeKey);
    }

    const { count: remaining } = await remainingQuery;

    return new Response(
      JSON.stringify({
        geocoded,
        errors,
        remaining: remaining || 0,
        batchSize: entities.length,
        entityTypeKey: entityTypeKey || null,
        message: `Geocoded ${geocoded}/${entities.length}. ${remaining} remaining.`
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
