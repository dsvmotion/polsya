export type OrganizationRole = 'admin' | 'manager' | 'rep' | 'ops';
export type OrganizationMemberStatus = 'active' | 'invited' | 'disabled';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  created_at: string;
  updated_at: string;
}
