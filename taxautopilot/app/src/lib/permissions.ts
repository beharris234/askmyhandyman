/**
 * Permission helpers shared by client/server.
 */

export type Role = "owner" | "admin" | "preparer";

export function isManager(role: Role | string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canManageTeam(role: Role | string | null | undefined): boolean {
  return isManager(role);
}

export function canEditAnyClient(role: Role | string | null | undefined): boolean {
  // Owners/admins edit anything; preparers edit their assigned + unassigned
  return isManager(role);
}

export function canReassignClients(role: Role | string | null | undefined): boolean {
  return isManager(role);
}

/**
 * Default filter for the clients list page based on user's role.
 */
export function defaultClientFilter(role: Role | string | null | undefined): "mine" | "all" {
  return isManager(role) ? "all" : "mine";
}
