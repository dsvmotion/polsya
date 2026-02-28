-- PROD-01A: Extend CRM pipeline from 3 states to 7.
-- Adds qualified, proposal, retained, lost to the existing pharmacy_status enum.
-- Existing values (not_contacted, contacted, client) are preserved — no data migration needed.
-- ALTER TYPE ... ADD VALUE is non-transactional in Postgres; each statement must succeed independently.

ALTER TYPE public.pharmacy_status ADD VALUE IF NOT EXISTS 'qualified' AFTER 'contacted';
ALTER TYPE public.pharmacy_status ADD VALUE IF NOT EXISTS 'proposal' AFTER 'qualified';
ALTER TYPE public.pharmacy_status ADD VALUE IF NOT EXISTS 'retained' AFTER 'client';
ALTER TYPE public.pharmacy_status ADD VALUE IF NOT EXISTS 'lost' AFTER 'retained';
