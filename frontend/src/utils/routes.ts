/**
 * Centralized Route Configuration
 * Prevents code duplication and ensures consistency
 */

export const USER_ROUTES = {
  super_admin: '/super-admin/dashboard',
  tenant_admin: '/tenant-admin/dashboard',
  team_member: '/team-member/dashboard',
  client: '/client/dashboard',
} as const;

export type UserType = keyof typeof USER_ROUTES;

/**
 * Get the appropriate route for a user type
 * @param userType - The user type
 * @returns The route path for the user type
 */
export function getRouteForUser(userType: string): string {
  return USER_ROUTES[userType as UserType] || '/';
}
