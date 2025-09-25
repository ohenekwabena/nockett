import { EqualIcon } from "lucide-react";
import {
  IconlyActivity,
  IconlyTicket,
  IconlyArrowUpCircle,
  IconlyArrowDownSquare,
  IconlyLock,
  IconlySetting,
  IconlyUnlock,
  IconlyInfoSquare,
  IconlyMoreCircle,
  IconlyGraph,
  IconlyDocument,
} from "./../components/icons";
import { GiSpottedBug } from "react-icons/gi";

export const DUMMY_TICKETS = [
  {
    id: "clx123abc456",
    title: "Login page not responding",
    description:
      "Users are unable to access the login page. The page loads but the form submission fails with a 500 error.",
    category: "BUG",
    priority: "HIGH",
    status: "OPEN",
    assignee: {
      id: "u456",
      name: "John Doe",
    },
    slaDueAt: new Date("2024-01-25"),
    createdAt: new Date("2024-01-20"),
    attachments: [{ id: "1", name: "screenshot.png" }],
  },
  {
    id: "clx789def012",
    title: "Add dark mode support",
    description:
      "Implement dark mode theme across the application to improve user experience during low-light conditions.",
    category: "FEATURE",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    assignee: {
      id: "u123",
      name: "Sarah Wilson",
    },
    slaDueAt: new Date("2024-02-01"),
    createdAt: new Date("2024-01-18"),
    attachments: [],
  },
  {
    id: "clx345ghi678",
    title: "Database performance optimization",
    description:
      "Query performance has degraded significantly. Need to analyze and optimize slow queries in the user dashboard.",
    category: "PERFORMANCE",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignee: {
      id: "u456",
      name: "Mike Chen",
    },
    slaDueAt: new Date("2024-01-23"),
    createdAt: new Date("2024-01-15"),
    attachments: [
      { id: "2", name: "query-analysis.sql" },
      { id: "3", name: "performance-report.pdf" },
    ],
  },
  {
    id: "clx901jkl234",
    title: "Update user documentation",
    description: "The current user guide is outdated and doesn't reflect the new features added in the last quarter.",
    category: "DOCUMENTATION",
    priority: "LOW",
    status: "OPEN",
    assignee: undefined,
    slaDueAt: undefined,
    createdAt: new Date("2024-01-19"),
    attachments: [],
  },
  {
    id: "clx567mno890",
    title: "Email notifications not working",
    description: "Users report they are not receiving email notifications for ticket updates and system alerts.",
    category: "BUG",
    priority: "MEDIUM",
    status: "CLOSED",
    assignee: {
      id: "u789",
      name: "Emma Rodriguez",
    },
    slaDueAt: new Date("2024-01-22"),
    createdAt: new Date("2024-01-12"),
    attachments: [{ id: "4", name: "email-logs.txt" }],
  },
];

export const DUMMY_STATS = [
  {
    title: "Total Tickets",
    value: 5,
    iconType: "ticket" as const,
    lightColor: "#3B82F6", // Blue
    darkColor: "#60A5FA", // Light Blue
  },
  {
    title: "Open Tickets",
    value: 2,
    iconType: "unlock" as const,
    lightColor: "#10B981", // Green
    darkColor: "#34D399", // Light Green
  },
  {
    title: "In Progress",
    value: 2,
    iconType: "activity" as const,
    lightColor: "#F59E0B", // Yellow
    darkColor: "#FBBF24", // Light Yellow
  },
  {
    title: "Closed Tickets",
    value: 1,
    iconType: "lock" as const,
    lightColor: "#6B7280", // Gray
    darkColor: "#9CA3AF", // Light Gray
  },
];

export const ICON_MAP = {
  ticket: IconlyTicket,
  unlock: IconlyUnlock,
  activity: IconlyActivity,
  lock: IconlyLock,
} as const;

export const PRIORITY_ICONS = {
  LOW: IconlyArrowDownSquare,
  MEDIUM: EqualIcon,
  HIGH: IconlyArrowUpCircle,
};

export const STATUS_ICONS = {
  OPEN: IconlyUnlock,
  IN_PROGRESS: IconlyActivity,
  CLOSED: IconlyLock,
};

export const CATEGORY_ICONS = {
  BUG: GiSpottedBug,
  FEATURE: IconlyMoreCircle,
  SUPPORT: IconlyInfoSquare,
  MAINTENANCE: IconlySetting,
  PERFORMANCE: IconlyGraph,
  DOCUMENTATION: IconlyDocument,
};

export const PRIORITY_COLORS = {
  LOW: "#10B981", // Green
  MEDIUM: "#F59E0B", // Yellow
  HIGH: "#EF4444", // Red
};

export const STATUS_COLORS = {
  OPEN: "#3B82F6", // Blue
  IN_PROGRESS: "#FBBF24", // Yellow
  CLOSED: "#10B981", // Green
};

export const CATEGORY_COLORS = {
  BUG: "#EF4444", // Red
  FEATURE: "#3B82F6", // Blue
  SUPPORT: "#10B981", // Green
  MAINTENANCE: "#F59E0B", // Yellow
  PERFORMANCE: "#8B5CF6", // Purple
  DOCUMENTATION: "#7C3AED", // Teal
};

export const CATEGORIES = ["BUG", "FEATURE", "PERFORMANCE", "DOCUMENTATION", "SUPPORT", "MAINTENANCE"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
export const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];
