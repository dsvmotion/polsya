import { describe, it, expect } from 'vitest';
import {
  canManageBilling,
  canManageWorkspace,
  canInviteMembers,
  canRemoveMembers,
  canEditEntityTypes,
  canDeleteEntities,
  canManageIntegrations,
  canViewReports,
  canExportData,
} from '@/lib/rbac';
import type { OrganizationRole } from '@/types/organization';

const roles: OrganizationRole[] = ['admin', 'manager', 'rep', 'ops'];

describe('rbac', () => {
  describe('canManageBilling', () => {
    it('allows admin', () => expect(canManageBilling('admin')).toBe(true));
    it('allows manager', () => expect(canManageBilling('manager')).toBe(true));
    it('denies rep', () => expect(canManageBilling('rep')).toBe(false));
    it('denies ops', () => expect(canManageBilling('ops')).toBe(false));
    it('denies null', () => expect(canManageBilling(null)).toBe(false));
    it('denies undefined', () => expect(canManageBilling(undefined)).toBe(false));
  });

  describe('canManageWorkspace', () => {
    it('mirrors canManageBilling (admin/manager only)', () => {
      for (const role of roles) {
        expect(canManageWorkspace(role)).toBe(canManageBilling(role));
      }
    });
  });

  describe('canInviteMembers (admin only)', () => {
    it('allows admin', () => expect(canInviteMembers('admin')).toBe(true));
    it('denies manager', () => expect(canInviteMembers('manager')).toBe(false));
    it('denies rep', () => expect(canInviteMembers('rep')).toBe(false));
    it('denies ops', () => expect(canInviteMembers('ops')).toBe(false));
    it('denies null', () => expect(canInviteMembers(null)).toBe(false));
  });

  describe('canRemoveMembers (admin only)', () => {
    it('allows admin', () => expect(canRemoveMembers('admin')).toBe(true));
    it('denies manager', () => expect(canRemoveMembers('manager')).toBe(false));
    it('denies rep', () => expect(canRemoveMembers('rep')).toBe(false));
  });

  describe('canEditEntityTypes (admin/manager)', () => {
    it('allows admin', () => expect(canEditEntityTypes('admin')).toBe(true));
    it('allows manager', () => expect(canEditEntityTypes('manager')).toBe(true));
    it('denies rep', () => expect(canEditEntityTypes('rep')).toBe(false));
    it('denies ops', () => expect(canEditEntityTypes('ops')).toBe(false));
  });

  describe('canDeleteEntities (admin/manager)', () => {
    it('allows admin', () => expect(canDeleteEntities('admin')).toBe(true));
    it('allows manager', () => expect(canDeleteEntities('manager')).toBe(true));
    it('denies rep', () => expect(canDeleteEntities('rep')).toBe(false));
  });

  describe('canManageIntegrations (admin/manager)', () => {
    it('allows admin', () => expect(canManageIntegrations('admin')).toBe(true));
    it('allows manager', () => expect(canManageIntegrations('manager')).toBe(true));
    it('denies rep', () => expect(canManageIntegrations('rep')).toBe(false));
  });

  describe('canViewReports (all roles)', () => {
    it.each(roles)('allows %s', (role) => {
      expect(canViewReports(role)).toBe(true);
    });
    it('denies null', () => expect(canViewReports(null)).toBe(false));
  });

  describe('canExportData (admin/manager)', () => {
    it('allows admin', () => expect(canExportData('admin')).toBe(true));
    it('allows manager', () => expect(canExportData('manager')).toBe(true));
    it('denies rep', () => expect(canExportData('rep')).toBe(false));
    it('denies ops', () => expect(canExportData('ops')).toBe(false));
  });
});
