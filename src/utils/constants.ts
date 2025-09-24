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
      name: "Emma Rodriguez",
    },
    slaDueAt: new Date("2024-01-22"),
    createdAt: new Date("2024-01-12"),
    attachments: [{ id: "4", name: "email-logs.txt" }],
  },
];
