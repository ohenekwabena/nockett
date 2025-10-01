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
  IconlyDangerCircle,
  IconlyStar,
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
  MINOR: IconlyArrowDownSquare,
  MEDIUM: EqualIcon,
  HIGH: IconlyArrowUpCircle,
  MAJOR: IconlyArrowUpCircle,
  CRITICAL: IconlyDangerCircle,
  HIGHEST: IconlyDangerCircle,
  DEFAULT: IconlyInfoSquare,
};

export const STATUS_ICONS = {
  OPEN: IconlyUnlock,
  IN_PROGRESS: IconlyActivity,
  CLOSED: IconlyLock,
  DEFAULT: IconlyInfoSquare,
};

export const CATEGORY_ICONS = {
  BUG: GiSpottedBug,
  FEATURE: IconlyMoreCircle,
  SUPPORT: IconlyInfoSquare,
  MAINTENANCE: IconlySetting,
  PERFORMANCE: IconlyGraph,
  DOCUMENTATION: IconlyDocument,
  DEFAULT: IconlyStar,
};

export const PRIORITY_COLORS = {
  LOW: "#10B981", // Green
  MINOR: "#10B981", // Green
  MEDIUM: "#F59E0B", // Yellow
  HIGH: "#EF4444", // Red
  MAJOR: "#EF4444", // Red
  HIGHEST: "#991B1B", // Darker Red
  CRITICAL: "#DC2626", // Dark Red
  DEFAULT: "#6B7280", // Gray
};

export const STATUS_COLORS = {
  OPEN: "#FBBF24", // Yellow
  IN_PROGRESS: "#10B981", // Green
  CLOSED: "#6B7280", // Blue
  DEFAULT: "#6B7280", // Gray
};

export const CATEGORY_COLORS = {
  BUG: "#EF4444", // Red
  FEATURE: "#3B82F6", // Blue
  SUPPORT: "#10B981", // Green
  MAINTENANCE: "#F59E0B", // Yellow
  PERFORMANCE: "#8B5CF6", // Purple
  DOCUMENTATION: "#7C3AED", // Teal
  DEFAULT: "#6B7280", // Gray
};

export const CATEGORIES = ["BUG", "FEATURE", "PERFORMANCE", "DOCUMENTATION", "SUPPORT", "MAINTENANCE"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
export const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];

// Database Entity Constants
export const TICKET_STATUSES = [
  { id: "OPEN", name: "Open", color: "#3B82F6" },
  { id: "IN_PROGRESS", name: "In Progress", color: "#FBBF24" },
  { id: "PENDING", name: "Pending", color: "#F59E0B" },
  { id: "RESOLVED", name: "Resolved", color: "#10B981" },
  { id: "CLOSED", name: "Closed", color: "#6B7280" },
  { id: "CANCELLED", name: "Cancelled", color: "#EF4444" },
] as const;

export const DEFAULT_TICKET_CATEGORIES = [
  { name: "Bug Report" },
  { name: "Feature Request" },
  { name: "Technical Support" },
  { name: "Hardware Issue" },
  { name: "Software Issue" },
  { name: "Network Problem" },
  { name: "Performance Issue" },
  { name: "Security Incident" },
  { name: "Documentation" },
  { name: "Maintenance" },
  { name: "Training Request" },
  { name: "Access Request" },
] as const;

export const DEFAULT_TICKET_PRIORITIES = [
  { name: "Low", color: "#10B981" },
  { name: "Medium", color: "#F59E0B" },
  { name: "High", color: "#EF4444" },
  { name: "Critical", color: "#DC2626" },
  { name: "Urgent", color: "#991B1B" },
] as const;

export const DEFAULT_DEPARTMENTS = [
  { name: "Information Technology" },
  { name: "Human Resources" },
  { name: "Finance" },
  { name: "Marketing" },
  { name: "Sales" },
  { name: "Operations" },
  { name: "Customer Support" },
  { name: "Legal" },
  { name: "Research & Development" },
  { name: "Quality Assurance" },
  { name: "Administration" },
  { name: "Security" },
] as const;

export const DEFAULT_ROLES = [
  { name: "Admin" },
  { name: "Manager" },
  { name: "Technician" },
  { name: "Support Agent" },
  { name: "End User" },
  { name: "Supervisor" },
  { name: "Analyst" },
  { name: "Specialist" },
  { name: "Coordinator" },
  { name: "Observer" },
] as const;

export const DEFAULT_ASSIGNEES = [
  { name: "John Doe" },
  { name: "Sarah Wilson" },
  { name: "Mike Chen" },
  { name: "Emma Rodriguez" },
  { name: "David Kumar" },
  { name: "Lisa Thompson" },
  { name: "James Brown" },
  { name: "Maria Garcia" },
  { name: "Robert Johnson" },
  { name: "Jennifer Davis" },
] as const;

// Ticket History Actions
export const TICKET_HISTORY_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  STATUS_CHANGED: "status_changed",
  PRIORITY_CHANGED: "priority_changed",
  ASSIGNED: "assigned",
  UNASSIGNED: "unassigned",
  COMMENT_ADDED: "comment_added",
  NOTE_ADDED: "note_added",
  ATTACHMENT_ADDED: "attachment_added",
  ATTACHMENT_REMOVED: "attachment_removed",
  CATEGORY_CHANGED: "category_changed",
  CLOSED: "closed",
  REOPENED: "reopened",
  SLA_BREACHED: "sla_breached",
  ESCALATED: "escalated",
} as const;

// Knowledge Base Tags
export const DEFAULT_KB_TAGS = [
  "troubleshooting",
  "setup",
  "configuration",
  "bug-fix",
  "workaround",
  "hardware",
  "software",
  "network",
  "security",
  "performance",
  "maintenance",
  "upgrade",
  "installation",
  "documentation",
  "tutorial",
  "faq",
  "best-practices",
  "common-issues",
] as const;

// File Upload Constants
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const FILE_TYPE_ICONS = {
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🖼️",
  "application/pdf": "📄",
  "text/plain": "📝",
  "application/msword": "📄",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📄",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "application/zip": "🗜️",
  "application/x-zip-compressed": "🗜️",
  default: "📎",
} as const;

// SLA Timer Constants (in hours)
export const SLA_TIMERS = {
  LOW: 72, // 3 days
  MEDIUM: 48, // 2 days
  HIGH: 24, // 1 day
  CRITICAL: 8, // 8 hours
  URGENT: 4, // 4 hours
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
} as const;

// Search Constants
export const SEARCH_FILTERS = {
  ALL: "all",
  TITLE: "title",
  DESCRIPTION: "description",
  TICKET_ID: "ticket_id",
  ASSIGNEE: "assignee",
  CREATOR: "creator",
} as const;

// Date Format Constants
export const DATE_FORMATS = {
  DISPLAY: "MMM DD, YYYY",
  DISPLAY_WITH_TIME: "MMM DD, YYYY HH:mm",
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  SHORT: "MM/DD/YYYY",
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  TICKET_CREATED: "ticket_created",
  TICKET_UPDATED: "ticket_updated",
  TICKET_ASSIGNED: "ticket_assigned",
  TICKET_CLOSED: "ticket_closed",
  COMMENT_ADDED: "comment_added",
  SLA_BREACH_WARNING: "sla_breach_warning",
  SLA_BREACHED: "sla_breached",
} as const;
