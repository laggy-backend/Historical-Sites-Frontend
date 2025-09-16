/**
 * Permission utilities for role-based access control
 */

export type UserRole = 'visitor' | 'contributor' | 'moderator' | 'admin';

/**
 * Check if user can create content (sites, tags, categories)
 * @param role User's role
 * @returns True if user can create content
 */
export const canCreateContent = (role?: UserRole): boolean => {
  if (!role) return false;
  return ['contributor', 'moderator', 'admin'].includes(role);
};

/**
 * Check if user can moderate content
 * @param role User's role
 * @returns True if user can moderate content
 */
export const canModerateContent = (role?: UserRole): boolean => {
  if (!role) return false;
  return ['moderator', 'admin'].includes(role);
};

/**
 * Check if user is admin
 * @param role User's role
 * @returns True if user is admin
 */
export const isAdmin = (role?: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if user can edit a specific site
 * @param siteUserId ID of the site owner
 * @param currentUserId Current user's ID
 * @param currentUserRole Current user's role
 * @returns True if user can edit the site
 */
export const canEditSite = (
  siteUserId: number,
  currentUserId?: number,
  currentUserRole?: UserRole
): boolean => {
  if (!currentUserId || !currentUserRole) return false;

  // Site owner can always edit
  if (siteUserId === currentUserId) return true;

  // Moderators and admins can edit any site
  return canModerateContent(currentUserRole);
};

/**
 * Check if user can delete a specific site
 * @param siteUserId ID of the site owner
 * @param currentUserId Current user's ID
 * @param currentUserRole Current user's role
 * @returns True if user can delete the site
 */
export const canDeleteSite = (
  siteUserId: number,
  currentUserId?: number,
  currentUserRole?: UserRole
): boolean => {
  // Same permissions as editing for now
  return canEditSite(siteUserId, currentUserId, currentUserRole);
};

/**
 * Get user role display name
 * @param role User's role
 * @returns Formatted role name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    visitor: 'Visitor',
    contributor: 'Contributor',
    moderator: 'Moderator',
    admin: 'Administrator'
  };

  return roleNames[role];
};

/**
 * Get role-based navigation items
 * @param role User's role
 * @returns Array of allowed navigation items
 */
export const getAllowedNavigationItems = (role?: UserRole) => {
  const baseItems = ['explore', 'profile'];

  if (canCreateContent(role)) {
    baseItems.splice(1, 0, 'upload'); // Insert upload between explore and profile
  }

  return baseItems;
};