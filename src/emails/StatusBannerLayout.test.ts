import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";
import { TicketUpdatedEmail } from "./TicketUpdatedEmail";
import { TicketClosedEmail } from "./TicketClosedEmail";
import { TicketCreatedEmail } from "./TicketCreatedEmail";

// These render the production templates exactly as email-service does
// (`render(Template(props))`) and assert the Status Banner design survives the
// React -> HTML pass: banner colour keyed to status, the old -> new transition,
// and a working CTA.

describe("Status Banner — ticket updated", () => {
  it("keys the banner to the new status and shows the old -> new transition", async () => {
    const html = await render(
      TicketUpdatedEmail({
        title: "Checkout returns a 500 error on Safari",
        oldStatus: "OPEN",
        newStatus: "IN_PROGRESS",
        updaterName: "Daniel Brooks",
        ticketId: "NCK-2481",
        ticketUrl: "https://app.example.com/tickets",
        requesterName: "Maria Chen",
        createdDate: "Jun 7",
        eventTime: "2:14 PM",
      }),
    );

    // Banner colour for IN_PROGRESS (design STATUS_BOLD).
    expect(html).toContain("#b9770e");
    // Tag + serif title.
    expect(html).toContain("Status updated");
    expect(html).toContain("Moved to In Progress");
    // Human-readable status labels (not raw enums) in the summary + pills.
    expect(html).toContain("moved this ticket from Open to In Progress");
    expect(html).toContain("Open");
    expect(html).toContain("In Progress");
    // Subject, id, and activity-log context row.
    expect(html).toContain("Checkout returns a 500 error on Safari");
    expect(html).toContain("NCK-2481");
    expect(html).toContain("Opened by Maria Chen");
    // CTA + reply link.
    expect(html).toContain('href="https://app.example.com/tickets"');
    expect(html).toContain('href="https://app.example.com/tickets#reply"');
    expect(html).toContain("View ticket");
    expect(html).toContain("Reply");
  });

  it("omits the transition arrow when no previous status is known", async () => {
    const html = await render(
      TicketUpdatedEmail({
        title: "Some ticket",
        oldStatus: "",
        newStatus: "RESOLVED",
        updaterName: "Daniel Brooks",
      }),
    );

    expect(html).toContain("#1f8a4c"); // RESOLVED banner
    expect(html).toContain("Marked as Resolved");
    expect(html).toContain("resolved this ticket");
  });
});

describe("Status Banner — ticket closed", () => {
  it("reuses the banner with the status pinned to CLOSED", async () => {
    const html = await render(
      TicketClosedEmail({
        title: "Checkout returns a 500 error on Safari",
        closerName: "Daniel Brooks",
        oldStatus: "RESOLVED",
        ticketId: "NCK-2481",
        ticketUrl: "https://app.example.com/tickets",
      }),
    );

    expect(html).toContain("#5b6b85"); // CLOSED banner
    expect(html).toContain("Ticket closed");
    expect(html).toContain("Daniel Brooks closed this ticket");
    // Transition from the prior status is preserved.
    expect(html).toContain("Resolved");
  });
});

describe("Status Banner — ticket created", () => {
  it("renders the 'New ticket' banner with the description in the activity log", async () => {
    const html = await render(
      TicketCreatedEmail({
        title: "Checkout returns a 500 error on Safari",
        description: "Users are hitting a 500 at checkout on Safari 17.",
        status: "OPEN",
        creatorName: "Maria Chen",
        ticketId: "NCK-2481",
        ticketUrl: "https://app.example.com/tickets?ticket=NCK-2481",
        createdDate: "Jun 7",
        eventTime: "2:14 PM",
      }),
    );

    expect(html).toContain("New ticket");
    expect(html).toContain("New ticket opened");
    expect(html).toContain("Maria Chen opened this ticket");
    // Activity-log "created" row surfaces the description.
    expect(html).toContain("Ticket opened");
    expect(html).toContain("Users are hitting a 500 at checkout on Safari 17.");
    expect(html).toContain("#5b6b85"); // OPEN banner
    // CTA carries the deep link to the ticket.
    expect(html).toContain('href="https://app.example.com/tickets?ticket=NCK-2481"');
  });
});
