import type { PrivilegeLevel, Role } from "../types";
import { HERO_MANAGER_ID } from "../services";

// Seed: Sarah Williams already manages a team, so her privilege starts at
// "manager". Everyone else defaults to "standard" until an administrator
// grants them Team Lead or Manager access below.
export const DEFAULT_PRIVILEGES: Record<string, PrivilegeLevel> = {
  [HERO_MANAGER_ID]: "manager",
};

export const PRIVILEGE_LABELS: Record<PrivilegeLevel, string> = {
  standard: "Standard Employee",
  team_lead: "Team Lead",
  manager: "Manager",
};

export const PRIVILEGE_DESCRIPTIONS: Record<PrivilegeLevel, string> = {
  standard: "Sees only their own communication dashboard.",
  team_lead: "Adds a Manager View scoped to any direct reports assigned to them.",
  manager: "Adds a Manager View with full visibility into their direct reports' dashboards.",
};

export function privilegeToRole(privilege: PrivilegeLevel): Role {
  if (privilege === "manager") return "manager";
  if (privilege === "team_lead") return "team_lead";
  return "employee";
}
