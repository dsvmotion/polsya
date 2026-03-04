-- Add provider column to ai_chat_config (openai | anthropic).
-- Platform admins can set provider via direct DB: UPDATE ai_chat_config SET provider = 'anthropic', model = 'claude-3-5-sonnet-20241022' WHERE organization_id = '...';

alter table public.ai_chat_config
  add column if not exists provider text not null default 'openai'
  check (provider in ('openai', 'anthropic'));

comment on column public.ai_chat_config.provider is 'AI provider: openai (default) or anthropic. Model must match provider (gpt-* for openai, claude-* for anthropic).';
