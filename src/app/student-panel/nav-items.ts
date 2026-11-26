import {
  ClipboardCheckIcon,
  FileUpIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  RouteIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** The student panel's sections, in sidebar order. */
export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/student-panel/dashboard", icon: LayoutDashboardIcon },
  { id: "documents", label: "Documents & Upload", href: "/student-panel/uploads", icon: FileUpIcon },
  { id: "graph", label: "Knowledge Graph", href: "/student-panel/knowledge-graph", icon: NetworkIcon },
  { id: "assessment", label: "Adaptive Exam & Assessment", href: "/student-panel/assessment", icon: ClipboardCheckIcon },
  { id: "path", label: "Personal Learning Path", href: "/student-panel/learning-path", icon: RouteIcon },
];
