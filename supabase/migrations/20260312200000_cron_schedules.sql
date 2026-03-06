-- ============================================================================
-- cron schedules for phase 4 edge functions
-- ============================================================================
-- uses pg_cron + pg_net (both enabled by default on supabase)
-- edge functions are invoked via http post using the service role key
-- note: current_setting('supabase.service_role_key') is evaluated at cron
--       execution time (not migration time), so it lives inside the command.
-- ============================================================================

-- enable required extensions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. email-sync — every 5 minutes
-- ---------------------------------------------------------------------------
select cron.schedule(
  'email-sync-cron',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := 'https://taetxohwuuzufmkzpzhb.supabase.co/functions/v1/email-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- 2. calendar-sync — every 10 minutes
-- ---------------------------------------------------------------------------
select cron.schedule(
  'calendar-sync-cron',
  '*/10 * * * *',
  $$
  select net.http_post(
    url    := 'https://taetxohwuuzufmkzpzhb.supabase.co/functions/v1/calendar-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- 3. activity-reminders — every hour at :00
-- ---------------------------------------------------------------------------
select cron.schedule(
  'activity-reminders-cron',
  '0 * * * *',
  $$
  select net.http_post(
    url    := 'https://taetxohwuuzufmkzpzhb.supabase.co/functions/v1/activity-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- 4. ai-weekly-digest — mondays at 08:00 utc
-- ---------------------------------------------------------------------------
select cron.schedule(
  'ai-weekly-digest-cron',
  '0 8 * * 1',
  $$
  select net.http_post(
    url    := 'https://taetxohwuuzufmkzpzhb.supabase.co/functions/v1/ai-weekly-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- 5. workflow-engine — every 15 minutes
-- ---------------------------------------------------------------------------
select cron.schedule(
  'workflow-engine-cron',
  '*/15 * * * *',
  $$
  select net.http_post(
    url    := 'https://taetxohwuuzufmkzpzhb.supabase.co/functions/v1/workflow-engine',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{}'::jsonb
  );
  $$
);
