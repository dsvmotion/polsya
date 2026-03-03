import { describe, expect, it } from 'vitest';
import {
  hasAllowedMembershipRole,
  hasAnyAllowedRole,
  resolveMembershipScope,
  type MembershipRow,
} from '../../supabase/functions/_shared/authz-policy.ts';

describe('authz-policy role checks', () => {
  it('accepts when primary role is allowed', () => {
    const allowed = hasAnyAllowedRole({
      userRole: 'admin',
      userRoles: [],
      allowedRoles: ['admin', 'ops'],
    });
    expect(allowed).toBe(true);
  });

  it('accepts when secondary roles include allowed role', () => {
    const allowed = hasAnyAllowedRole({
      userRole: 'rep',
      userRoles: ['viewer', 'ops'],
      allowedRoles: ['admin', 'ops'],
    });
    expect(allowed).toBe(true);
  });

  it('denies when no role matches', () => {
    const allowed = hasAnyAllowedRole({
      userRole: 'rep',
      userRoles: ['viewer'],
      allowedRoles: ['admin', 'ops'],
    });
    expect(allowed).toBe(false);
  });

  it('checks membership role against allowed list', () => {
    expect(
      hasAllowedMembershipRole({ membershipRole: 'manager', allowedRoles: ['admin', 'manager'] }),
    ).toBe(true);
    expect(
      hasAllowedMembershipRole({ membershipRole: 'rep', allowedRoles: ['admin', 'manager'] }),
    ).toBe(false);
  });
});

describe('authz-policy membership scope resolution', () => {
  const memberships: MembershipRow[] = [
    { organization_id: 'org-1', role: 'admin' },
    { organization_id: 'org-2', role: 'manager' },
  ];

  it('returns no_membership when user has none', () => {
    const result = resolveMembershipScope({ activeMemberships: [], requestedOrgId: null });
    expect(result.kind).toBe('no_membership');
  });

  it('resolves explicit org context when membership exists', () => {
    const result = resolveMembershipScope({
      activeMemberships: memberships,
      requestedOrgId: 'org-2',
    });
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.membership.organization_id).toBe('org-2');
      expect(result.membership.role).toBe('manager');
    }
  });

  it('returns org_forbidden when requested org is not in memberships', () => {
    const result = resolveMembershipScope({
      activeMemberships: memberships,
      requestedOrgId: 'org-missing',
    });
    expect(result.kind).toBe('org_forbidden');
    if (result.kind === 'org_forbidden') {
      expect(result.requestedOrgId).toBe('org-missing');
    }
  });

  it('resolves single membership without header', () => {
    const result = resolveMembershipScope({
      activeMemberships: [{ organization_id: 'org-1', role: 'ops' }],
      requestedOrgId: null,
    });
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.membership.organization_id).toBe('org-1');
    }
  });

  it('requires org context when user has multiple active memberships', () => {
    const result = resolveMembershipScope({
      activeMemberships: memberships,
      requestedOrgId: null,
    });
    expect(result.kind).toBe('org_context_missing');
  });
});
