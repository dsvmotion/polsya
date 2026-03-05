import type { OrganizationRole } from '@/types/organization';

// ── Role sets ────────────────────────────────────────────────────────────────
const ADMIN_ONLY = new Set<OrganizationRole>(['admin']);
const ADMIN_MANAGER = new Set<OrganizationRole>(['admin', 'manager']);
const ALL_ROLES = new Set<OrganizationRole>(['admin', 'manager', 'rep', 'ops']);

// ── Helper ───────────────────────────────────────────────────────────────────
function hasRole(role: OrganizationRole | null | undefined, allowed: Set<OrganizationRole>): boolean {
  return !!role && allowed.has(role);
}

// ── Existing permissions ─────────────────────────────────────────────────────
export function canManageBilling(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_MANAGER);
}

export function canManageWorkspace(role: OrganizationRole | null | undefined): boolean {
  return canManageBilling(role);
}

// ── New permissions (Phase 3) ────────────────────────────────────────────────

/** Only admins can invite new team members */
export function canInviteMembers(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_ONLY);
}

/** Only admins can remove team members */
export function canRemoveMembers(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_ONLY);
}

/** Admins and managers can edit entity type configuration */
export function canEditEntityTypes(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_MANAGER);
}

/** Admins and managers can bulk-delete entities */
export function canDeleteEntities(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_MANAGER);
}

/** Admins and managers can manage integrations */
export function canManageIntegrations(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_MANAGER);
}

/** All roles can view reports */
export function canViewReports(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ALL_ROLES);
}

/** Admins and managers can export data */
export function canExportData(role: OrganizationRole | null | undefined): boolean {
  return hasRole(role, ADMIN_MANAGER);
}
