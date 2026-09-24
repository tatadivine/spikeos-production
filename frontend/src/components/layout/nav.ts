import type { Role } from "../../types";
import {
  Home,
  Inbox,
  CheckSquare,
  Bell,
  Repeat,
  Award,
  FileSearch,
  Users,
  ClipboardCheck,
  TrendingUp,
  Building2,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  children?: { label: string; path: string }[];
  minRole?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: Home },
  {
    label: "Communication",
    path: "/communication",
    icon: Inbox,
    children: [
      { label: "My Communication", path: "/communication" },
      { label: "Commitments", path: "/commitments" },
      { label: "Follow-ups", path: "/followups" },
      { label: "Alerts", path: "/alerts" },
    ],
  },
  {
    label: "Performance",
    path: "/performance",
    icon: Award,
    children: [
      { label: "My Performance", path: "/performance" },
      { label: "Coaching", path: "/coaching" },
      { label: "Evidence", path: "/evidence" },
    ],
  },
  { label: "Customers", path: "/customers", icon: Users },
  {
    label: "Team",
    path: "/team",
    icon: ClipboardCheck,
    minRole: ["team_lead", "manager", "administrator"],
    children: [
      { label: "Team Overview", path: "/team" },
      { label: "Reviews", path: "/reviews" },
      { label: "Team Trends", path: "/team/trends" },
    ],
  },
  {
    label: "Organization",
    path: "/organization",
    icon: Building2,
    minRole: ["administrator"],
    children: [
      { label: "Overview", path: "/organization" },
      { label: "Departments", path: "/organization/departments" },
      { label: "Trends", path: "/organization/trends" },
    ],
  },
  { label: "Analytics", path: "/analytics", icon: BarChart3, minRole: ["administrator"] },
  { label: "Reports", path: "/reports", icon: FileText, minRole: ["administrator"] },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    minRole: ["administrator"],
    children: [
      { label: "General", path: "/settings" },
      { label: "Scoring", path: "/settings/scoring" },
      { label: "Exclusions", path: "/settings/exclusions" },
      { label: "Permissions", path: "/settings/permissions" },
      { label: "Integrations", path: "/settings/integrations" },
      { label: "Audit Log", path: "/settings/audit" },
    ],
  },
  { label: "Help", path: "/help", icon: HelpCircle },
];

export function visibleNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.minRole || item.minRole.includes(role));
}

export const HOW_IT_WORKS_ICON = Layers;
export const BELL_ICON = Bell;
export const REPEAT_ICON = Repeat;
export const TREND_ICON = TrendingUp;
export const CHECK_ICON = CheckSquare;
export const EVIDENCE_ICON = FileSearch;
