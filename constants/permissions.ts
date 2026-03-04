import { ROLE_TYPE } from '@/types/api.types';

export const Permission = {
  METER_CREATE: 'meter:create',
  METER_READ: 'meter:read',
  METER_UPDATE: 'meter:update',
  METER_ASSIGN: 'meter:assign',
  METER_DELETE: 'meter:delete',
  CONSUMER_CREATE: 'consumer:create',
  CONSUMER_READ: 'consumer:read',
  CONSUMER_UPDATE: 'consumer:update',
  CONSUMER_DELETE: 'consumer:delete',
  BILLING_READ: 'billing:read',
  BILLING_GENERATE: 'billing:generate',
  BILLING_RECALCULATE: 'billing:recalculate',
  REPORT_GENERATE: 'report:generate',
  QUERY_MANAGE: 'query:manage',
  NOTIFICATION_MANAGE: 'notification:manage',
  AUDIT_READ: 'audit:read',
  USER_MANAGE: 'user:manage',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<ROLE_TYPE, readonly PermissionKey[]> = {
  [ROLE_TYPE.SUPER_ADMIN]: Object.values(Permission), // full access
  [ROLE_TYPE.STATE_ADMIN]: [
    Permission.METER_CREATE,
    Permission.METER_READ,
    Permission.METER_UPDATE,
    Permission.METER_ASSIGN,
    Permission.CONSUMER_CREATE,
    Permission.CONSUMER_READ,
    Permission.CONSUMER_UPDATE,
    Permission.CONSUMER_DELETE,
    Permission.BILLING_READ,
    Permission.BILLING_GENERATE,
    Permission.BILLING_RECALCULATE,
    Permission.REPORT_GENERATE,
    Permission.QUERY_MANAGE,
    Permission.NOTIFICATION_MANAGE,
    Permission.AUDIT_READ,
    Permission.USER_MANAGE,
  ],
  [ROLE_TYPE.BOARD_ADMIN]: [
    Permission.METER_CREATE,
    Permission.METER_READ,
    Permission.METER_UPDATE,
    Permission.METER_ASSIGN,
    Permission.CONSUMER_CREATE,
    Permission.CONSUMER_READ,
    Permission.CONSUMER_UPDATE,
    Permission.CONSUMER_DELETE,
    Permission.BILLING_READ,
    Permission.BILLING_GENERATE,
    Permission.BILLING_RECALCULATE,
    Permission.REPORT_GENERATE,
    Permission.QUERY_MANAGE,
    Permission.NOTIFICATION_MANAGE,
  ],
  [ROLE_TYPE.SUPPORT_AGENT]: [
    Permission.METER_READ,
    Permission.CONSUMER_READ,
    Permission.BILLING_READ,
    Permission.QUERY_MANAGE,
    Permission.NOTIFICATION_MANAGE,
  ],
  [ROLE_TYPE.AUDITOR]: [
    Permission.METER_READ,
    Permission.CONSUMER_READ,
    Permission.BILLING_READ,
    Permission.AUDIT_READ,
  ],
};

/**
 * Helper to check if a specific role has a certain permission.
 */
export function hasPermission(role: string | null | undefined, permission: PermissionKey): boolean {
  if (!role || role === 'CONSUMER') return false;
  const perms = ROLE_PERMISSIONS[role as ROLE_TYPE];
  return perms ? perms.includes(permission) : false;
}
