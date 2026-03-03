import type { OrganizationRole } from '@/types/organization';

const BILLING_MANAGER_ROLES = new Set<OrganizationRole>(['admin', 'manager']);

export function canManageBilling(role: OrganizationRole | null | undefined): boolean {
  return !!role && BILLING_MANAGER_ROLES.has(role);
}

export function canManageWorkspace(role: OrganizationRole | null | undefined): boolean {
  return canManageBilling(role);
}
