import type { UserRole } from '../types';
import type { InviteRole } from '../services/invitations.service';

export const ALL_INVITE_ROLES: InviteRole[] = ['host', 'creator', 'jolly'];

export function isInvitableRole(role: UserRole): role is InviteRole {
  return role === 'host' || role === 'creator' || role === 'jolly';
}

/** Current user's role first, then the other invite roles. */
export function getOrderedInviteRoles(userRole: UserRole): InviteRole[] {
  const primary = isInvitableRole(userRole) ? userRole : 'host';
  return [primary, ...ALL_INVITE_ROLES.filter((r) => r !== primary)];
}

export function inviteRoleToPointAction(
  role: InviteRole
): 'invite_host' | 'invite_creator' | 'invite_jolly' {
  if (role === 'host') return 'invite_host';
  if (role === 'creator') return 'invite_creator';
  return 'invite_jolly';
}
