export type MembershipRow = {
  organization_id: string;
  role: string;
};

export type MembershipResolution =
  | { kind: 'ok'; membership: MembershipRow }
  | { kind: 'no_membership' }
  | { kind: 'org_forbidden'; requestedOrgId: string }
  | { kind: 'org_context_missing' };

export function hasAnyAllowedRole(params: {
  userRole: string | null | undefined;
  userRoles: readonly string[] | null | undefined;
  allowedRoles: readonly string[];
}): boolean {
  const primaryRole = params.userRole ?? '';
  const roles = params.userRoles ?? [];
  return params.allowedRoles.includes(primaryRole) || roles.some((role) => params.allowedRoles.includes(role));
}

export function resolveMembershipScope(params: {
  activeMemberships: readonly MembershipRow[];
  requestedOrgId: string | null;
}): MembershipResolution {
  if (params.activeMemberships.length === 0) {
    return { kind: 'no_membership' };
  }

  if (params.requestedOrgId) {
    const membership = params.activeMemberships.find(
      (m) => m.organization_id === params.requestedOrgId,
    );
    if (!membership) {
      return { kind: 'org_forbidden', requestedOrgId: params.requestedOrgId };
    }
    return { kind: 'ok', membership };
  }

  if (params.activeMemberships.length === 1) {
    return { kind: 'ok', membership: params.activeMemberships[0] };
  }

  return { kind: 'org_context_missing' };
}

export function hasAllowedMembershipRole(params: {
  membershipRole: string;
  allowedRoles: readonly string[];
}): boolean {
  return params.allowedRoles.includes(params.membershipRole);
}
