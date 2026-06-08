import { describe, it, expect, vi, beforeEach } from "vitest";

// Intake talks only to the ticketService seam; stub it so the orchestration is
// exercised without Supabase or React.
vi.mock("@/services/ticket-service", () => ({
  ticketService: {
    getTicketCategories: vi.fn(),
    getTicketPriorities: vi.fn(),
    getAssignees: vi.fn(),
    getDemarcations: vi.fn(),
    getLinks: vi.fn(),
    getSites: vi.fn(),
    getServiceTypes: vi.fn(),
    getDetectionSources: vi.fn(),
    getTrafficImpacts: vi.fn(),
    createTicket: vi.fn(),
    createTicketNote: vi.fn(),
    uploadAttachment: vi.fn(),
  },
}));

import { ticketService, type Ticket } from "@/services/ticket-service";
import { validateTicketDraft, loadReferenceOptions, submitTicket, type TicketFields } from "./ticket-intake";

const seam = vi.mocked(ticketService);

const VALID_FIELDS: TicketFields = { title: "Fibre cut on core link", status: "OPEN" };
const CREATED: Ticket = { id: "t-1", title: "Fibre cut on core link", status: "OPEN" };

/** A stand-in File — uploadAttachment is mocked, so only `.name` is ever read. */
const fakeFile = (name: string): File => ({ name }) as File;

beforeEach(() => {
  vi.clearAllMocks();
  seam.createTicket.mockResolvedValue(CREATED);
  seam.createTicketNote.mockResolvedValue({ id: 1 });
  seam.uploadAttachment.mockResolvedValue({ id: 1, url: "u", filename: "f" });
});

describe("validateTicketDraft", () => {
  it("rejects a blank or whitespace-only title", () => {
    expect(validateTicketDraft({ title: "", status: "OPEN" })).toBe("Title is required");
    expect(validateTicketDraft({ title: "   ", status: "OPEN" })).toBe("Title is required");
  });

  it("accepts a non-empty title", () => {
    expect(validateTicketDraft(VALID_FIELDS)).toBeNull();
  });
});

describe("loadReferenceOptions", () => {
  it("folds the nine reference reads into one keyed result", async () => {
    seam.getTicketCategories.mockResolvedValue([{ id: 1, name: "Network" }]);
    seam.getTicketPriorities.mockResolvedValue([{ id: 2, name: "High" }]);
    seam.getAssignees.mockResolvedValue([{ id: 3, name: "Ada" }]);
    seam.getDemarcations.mockResolvedValue([{ id: 4, name: "CORE" }]);
    seam.getLinks.mockResolvedValue([{ id: 5, name: "Link-A" }]);
    seam.getSites.mockResolvedValue([{ id: 6, name: "SITE-1" }]);
    seam.getServiceTypes.mockResolvedValue([{ id: 7, name: "MPLS" }]);
    seam.getDetectionSources.mockResolvedValue([{ id: 8, name: "NMS" }]);
    seam.getTrafficImpacts.mockResolvedValue([{ id: 9, name: "Major" }]);

    const options = await loadReferenceOptions();

    expect(options).toEqual({
      categories: [{ id: 1, name: "Network" }],
      priorities: [{ id: 2, name: "High" }],
      assignees: [{ id: 3, name: "Ada" }],
      demarcations: [{ id: 4, name: "CORE" }],
      links: [{ id: 5, name: "Link-A" }],
      sites: [{ id: 6, name: "SITE-1" }],
      serviceTypes: [{ id: 7, name: "MPLS" }],
      detectionSources: [{ id: 8, name: "NMS" }],
      trafficImpacts: [{ id: 9, name: "Major" }],
    });
  });
});

describe("submitTicket", () => {
  it("rejects an invalid draft before creating anything", async () => {
    await expect(submitTicket({ fields: { title: "", status: "OPEN" } })).rejects.toThrow("Title is required");
    expect(seam.createTicket).not.toHaveBeenCalled();
  });

  it("creates the ticket, then the note, then the attachments — in that order", async () => {
    const result = await submitTicket({
      fields: VALID_FIELDS,
      initialNote: "First responder on site",
      attachments: [fakeFile("a.png"), fakeFile("b.pdf")],
      actorId: "user-9",
    });

    expect(seam.createTicket).toHaveBeenCalledWith(VALID_FIELDS);
    expect(seam.createTicketNote).toHaveBeenCalledWith({
      ticket_id: "t-1",
      content: "First responder on site",
      user_id: "user-9",
    });
    expect(seam.uploadAttachment).toHaveBeenCalledTimes(2);
    expect(seam.uploadAttachment).toHaveBeenNthCalledWith(1, "t-1", expect.objectContaining({ name: "a.png" }), "user-9");

    // create -> note -> attachments
    const createOrder = seam.createTicket.mock.invocationCallOrder[0];
    const noteOrder = seam.createTicketNote.mock.invocationCallOrder[0];
    const attachmentOrder = seam.uploadAttachment.mock.invocationCallOrder[0];
    expect(createOrder).toBeLessThan(noteOrder);
    expect(noteOrder).toBeLessThan(attachmentOrder);

    expect(result).toEqual({
      ticket: CREATED,
      noteCreated: true,
      attachmentsUploaded: 2,
      attachmentsFailed: 0,
      warnings: [],
    });
  });

  it("skips the note when none is provided (or it is blank)", async () => {
    await submitTicket({ fields: VALID_FIELDS, initialNote: "   " });
    expect(seam.createTicketNote).not.toHaveBeenCalled();
  });

  it("propagates a creation failure and does no follow-on writes", async () => {
    seam.createTicket.mockRejectedValue(new Error("insert failed"));
    await expect(submitTicket({ fields: VALID_FIELDS, initialNote: "x" })).rejects.toThrow("insert failed");
    expect(seam.createTicketNote).not.toHaveBeenCalled();
    expect(seam.uploadAttachment).not.toHaveBeenCalled();
  });

  it("treats a note failure as a warning, not a failed creation", async () => {
    seam.createTicketNote.mockRejectedValue(new Error("note boom"));

    const result = await submitTicket({ fields: VALID_FIELDS, initialNote: "note text" });

    expect(result.ticket).toEqual(CREATED);
    expect(result.noteCreated).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("note boom");
  });

  it("counts a failed attachment without aborting the others", async () => {
    seam.uploadAttachment
      .mockResolvedValueOnce({ id: 1, url: "u", filename: "ok.png" })
      .mockRejectedValueOnce(new Error("storage full"));

    const result = await submitTicket({
      fields: VALID_FIELDS,
      attachments: [fakeFile("ok.png"), fakeFile("bad.png")],
    });

    expect(result.attachmentsUploaded).toBe(1);
    expect(result.attachmentsFailed).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("bad.png");
    expect(result.warnings[0]).toContain("storage full");
  });
});
