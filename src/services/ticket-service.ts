import { createClient } from "@/api/supabase/client";
import { notifyTicketCreated, notifyTicketStatusChanged } from "@/lib/ticket-notifications";

// Type definitions
export interface Ticket {
  id: string;
  ticket_id?: string;
  title: string;
  description?: string;
  category_id?: number;
  priority_id?: number;
  status: string;
  creator_id?: string;
  assignee_id?: number;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  site?: string;
  system?: string;
  error_code?: string;
  ticket_number?: string;
  // Incident and timing fields
  incidentDate?: string;
  issueStart?: boolean;
  detectionTime?: string;
  escalationTime?: string;
  providerNotifiedTime?: string;
  issueCleared?: boolean;
  restorationTimeConfirmed?: string;
  grossDowntimeMin?: number;
  providerDowntimeMin?: number;
  rootCauseLev1?: string;
  rootCauseLev2?: string;
  slaImpacted?: boolean;
  redundancyAvailable?: boolean;
  partnerImpacted?: boolean;
  rfoReceived?: boolean;
  preventiveAction?: string;
  // Entity fields
  demarcation?: string;
  linkName?: string;
  siteId?: string;
  serviceType?: string;
  detectionSource?: string;
  trafficImpact?: string;
}

export interface TicketCategory {
  id: number;
  name: string;
}

export interface TicketPriority {
  id: number;
  name: string;
}

export interface TicketComment {
  id: number;
  ticket_id?: string;
  user_id?: string;
  content?: string;
  created_at?: string;
  users?: {
    name: string;
    image_url?: string;
  }[];
}

export interface TicketNote {
  id: number;
  ticket_id?: string;
  user_id?: string;
  content?: string;
  created_at?: string;
  users?: {
    id: string;
    name: string;
    email: string;
  }[];
}

export interface TicketAttachment {
  id: number;
  ticket_id?: string;
  url: string;
  filename: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface Assignee {
  id: number;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department_id?: number;
  created_at?: string;
}

/**
 * A Ticket with its joined reference relations normalized to plain single
 * objects (never Supabase's T | T[] join shape). Produced by the read seam.
 */
export interface TicketWithDetails extends Ticket {
  ticket_categories: TicketCategory | null;
  ticket_priorities: TicketPriority | null;
  assignee: Assignee | null;
  users: { id: string; name: string; email: string } | null;
}

/** Collapse a Supabase join (which may arrive as an object or a single-element array) to one value. */
function firstOrNull<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

/** Normalize a raw joined tickets row into a TicketWithDetails with plain relation fields. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTicketRow(row: any): TicketWithDetails {
  return {
    ...row,
    ticket_categories: firstOrNull<TicketCategory>(row.ticket_categories),
    ticket_priorities: firstOrNull<TicketPriority>(row.ticket_priorities),
    assignee: firstOrNull<Assignee>(row.assignee),
    users: firstOrNull(row.users),
  };
}

export interface Demarcation {
  id: number;
  name: string;
}

export interface Link {
  id: number;
  name: string;
}

export interface Site {
  id: number;
  name: string;
}

export interface ServiceType {
  id: number;
  name: string;
}

export interface DetectionSource {
  id: number;
  name: string;
}

export interface TrafficImpact {
  id: number;
  name: string;
}

/** Aggregate ticket counts shown on the dashboard. */
export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  highPriority: number;
}

export class TicketService {
  private supabase = createClient();

  /**
   * Unwrap a Supabase `{ data, error }` result for the throwing read/write seam
   * (ADR-0002): return the value or throw a contextual error, so callers get a
   * domain value or an exception — never the Postgres envelope.
   */
  private unwrap<T>(result: { data: T | null; error: { message: string } | null }, op: string): T {
    if (result.error) throw new Error(`ticketService.${op} failed: ${result.error.message}`);
    return result.data as T;
  }

  /**
   * Like {@link unwrap}, but for list reads: throws on error and coalesces a
   * null `data` to an empty array, so callers always get an array or an
   * exception (ADR-0002) — never null and never the Postgres envelope.
   */
  private unwrapList<T>(result: { data: T[] | null; error: { message: string } | null }, op: string): T[] {
    if (result.error) throw new Error(`ticketService.${op} failed: ${result.error.message}`);
    return result.data ?? [];
  }

  // Transform snake_case database columns to camelCase
  private transformTicket(dbTicket: any): Ticket {
    return {
      id: dbTicket.id,
      ticket_id: dbTicket.ticket_id,
      title: dbTicket.title,
      description: dbTicket.description,
      category_id: dbTicket.category_id,
      priority_id: dbTicket.priority_id,
      status: dbTicket.status,
      creator_id: dbTicket.creator_id,
      assignee_id: dbTicket.assignee_id,
      created_at: dbTicket.created_at,
      updated_at: dbTicket.updated_at,
      closed_at: dbTicket.closed_at,
      site: dbTicket.site,
      system: dbTicket.system,
      error_code: dbTicket.error_code,
      ticket_number: dbTicket.ticket_number,
      // Incident and timing fields - transform snake_case to camelCase
      incidentDate: dbTicket.incident_date,
      issueStart: dbTicket.issue_start,
      detectionTime: dbTicket.detection_time,
      escalationTime: dbTicket.escalation_time,
      providerNotifiedTime: dbTicket.provider_notified_time,
      issueCleared: dbTicket.issue_cleared,
      restorationTimeConfirmed: dbTicket.restoration_time_confirmed,
      grossDowntimeMin: dbTicket.gross_downtime_min,
      providerDowntimeMin: dbTicket.provider_downtime_min,
      rootCauseLev1: dbTicket.root_cause_lev1,
      rootCauseLev2: dbTicket.root_cause_lev2,
      slaImpacted: dbTicket.sla_impacted,
      redundancyAvailable: dbTicket.redundancy_available,
      partnerImpacted: dbTicket.partner_impacted,
      rfoReceived: dbTicket.rfo_received,
      preventiveAction: dbTicket.preventive_action,
      // Entity fields
      demarcation: dbTicket.demarcation,
      linkName: dbTicket.link_name,
      siteId: dbTicket.site_id,
      serviceType: dbTicket.service_type,
      detectionSource: dbTicket.detection_source,
      trafficImpact: dbTicket.traffic_impact,
    };
  }

  // TICKETS CRUD
  // Write seam (ADR-0002): returns the created domain Ticket and throws on a
  // data-access error, rather than handing back Supabase's { data, error }.
  async createTicket(ticket: Omit<Ticket, "id" | "created_at" | "updated_at">): Promise<Ticket> {
    const ticketWithGeneratedId = {
      ...ticket,
      ticket_id: ticket.ticket_id ?? (await this.generateNextTicketId()),
    };
    const snakeCaseTicket = this.toSnakeCase(ticketWithGeneratedId as Partial<Ticket>);
    const created = this.transformTicket(
      this.unwrap(await this.supabase.from("tickets").insert(snakeCaseTicket).select().single(), "createTicket"),
    );

    // Notify the creator; failures are logged, not swallowed, and never block creation.
    const notification = await notifyTicketCreated(ticket);
    if (!notification.ok) {
      console.error("Failed to send ticket creation email:", notification.error);
    }

    return created;
  }

  async createTicketsBulk(tickets: Array<Omit<Ticket, "id" | "created_at" | "updated_at">>): Promise<Ticket[]> {
    if (!tickets.length) {
      return [];
    }

    const generatedIds = await this.generateNextTicketIds(tickets.length);
    const snakeCaseTickets = tickets.map((ticket, index) =>
      this.toSnakeCase({
        ...ticket,
        ticket_id: ticket.ticket_id ?? generatedIds[index],
      } as Partial<Ticket>),
    );
    const inserted = this.unwrapList(
      await this.supabase.from("tickets").insert(snakeCaseTickets).select(),
      "createTicketsBulk",
    );
    return inserted.map((ticket) => this.transformTicket(ticket));
  }

  async getTickets(filters?: { status?: string; creator_id?: string; assignee_id?: number }): Promise<Ticket[]> {
    let query = this.supabase.from("tickets").select("*");

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.creator_id) query = query.eq("creator_id", filters.creator_id);
    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);

    // Transform all tickets from snake_case to camelCase
    const data = this.unwrapList(await query.order("created_at", { ascending: false }), "getTickets");
    return data.map((ticket) => this.transformTicket(ticket));
  }

  async getTicketById(id: string): Promise<Ticket> {
    // Transform single ticket from snake_case to camelCase
    return this.transformTicket(
      this.unwrap(await this.supabase.from("tickets").select("*").eq("id", id).single(), "getTicketById"),
    );
  }

  // Transform camelCase properties to snake_case for database
  private toSnakeCase(updates: Partial<Ticket>): Record<string, any> {
    const snakeCaseMap: Record<string, string> = {
      incidentDate: "incident_date",
      issueStart: "issue_start",
      detectionTime: "detection_time",
      escalationTime: "escalation_time",
      providerNotifiedTime: "provider_notified_time",
      issueCleared: "issue_cleared",
      restorationTimeConfirmed: "restoration_time_confirmed",
      grossDowntimeMin: "gross_downtime_min",
      providerDowntimeMin: "provider_downtime_min",
      rootCauseLev1: "root_cause_lev1",
      rootCauseLev2: "root_cause_lev2",
      slaImpacted: "sla_impacted",
      redundancyAvailable: "redundancy_available",
      partnerImpacted: "partner_impacted",
      rfoReceived: "rfo_received",
      preventiveAction: "preventive_action",
      linkName: "link_name",
      siteId: "site_id",
      serviceType: "service_type",
      detectionSource: "detection_source",
      trafficImpact: "traffic_impact",
    };

    const converted: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = snakeCaseMap[key] || key;
      converted[snakeKey] = value;
    }
    return converted;
  }

  private async generateNextTicketId(): Promise<string> {
    const [ticketId] = await this.generateNextTicketIds(1);
    return ticketId;
  }

  private async generateNextTicketIds(count: number): Promise<string[]> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;
    const ticketPrefix = `Ticket#${datePrefix}`;

    const { data, error } = await this.supabase
      .from("tickets")
      .select("ticket_id")
      .like("ticket_id", `${ticketPrefix}%`)
      .order("ticket_id", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const latestTicketId = data?.[0]?.ticket_id;
    const latestSequence = latestTicketId ? Number.parseInt(String(latestTicketId).slice(-3), 10) || 0 : 0;

    return Array.from({ length: count }, (_, index) => {
      const sequence = String(latestSequence + index + 1).padStart(3, "0");
      return `${ticketPrefix}${sequence}`;
    });
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const snakeCaseUpdates = this.toSnakeCase(updates);

    // Capture the prior status before the write so the status-change email can
    // show the "from -> to" transition. Only needed when the update touches status.
    let previousStatus: string | undefined;
    if (typeof updates.status !== "undefined") {
      const { data: prior } = await this.supabase.from("tickets").select("status").eq("id", id).single();
      previousStatus = prior?.status ?? undefined;
    }

    // Transform response back to camelCase
    const updatedTicket = this.transformTicket(
      this.unwrap(
        await this.supabase
          .from("tickets")
          .update({ ...snakeCaseUpdates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single(),
        "updateTicket",
      ),
    );

    // Notify every user when the status actually changes; failures are logged,
    // not swallowed, and never block the update. Skip no-op saves that re-submit
    // the same status so we don't email the whole workspace for nothing.
    if (typeof updates.status !== "undefined" && updatedTicket.status !== previousStatus) {
      const notification = await notifyTicketStatusChanged(updatedTicket, previousStatus);
      if (!notification.ok) {
        console.error("Failed to send ticket update email:", notification.error);
      }
    }

    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<void> {
    this.unwrap(await this.supabase.from("tickets").delete().eq("id", id), "deleteTicket");
  }

  // EXPORT METHOD FOR EXCEL
  // Read seam (ADR-0002): returns the enriched export rows and throws on a
  // data-access error.
  async getTicketsForExport() {
    const tickets = await this.getTickets();

    // Fetch the reference and sub-resource lookups. These readers now throw
    // (ADR-0002); catch each locally so one failed lookup degrades just that
    // column instead of aborting the whole export (partial export preserved).
    const assignees = await this.getAssignees().catch(() => []);
    const categories = await this.getTicketCategories().catch(() => []);
    const priorities = await this.getTicketPriorities().catch(() => []);
    const users = await this.getUsers().catch(() => []);

    // Create maps for quick lookup
    const assigneeMap = new Map(assignees.map((a) => [a.id, a.name]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const priorityMap = new Map(priorities.map((p) => [p.id, p.name]));
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Get all notes for all tickets
    const ticketNotes = new Map<string, string>();
    for (const ticket of tickets) {
      const notes = await this.getTicketNotes(ticket.id).catch(() => []);
      if (notes.length > 0) {
        ticketNotes.set(ticket.id, notes.map((n) => n.content).join("\n"));
      }
    }

    // Enrich tickets with additional data
    const enrichedData = tickets.map((ticket) => ({
      ticket,
      assigneeName: ticket.assignee_id ? assigneeMap.get(ticket.assignee_id) : undefined,
      categoryName: ticket.category_id ? categoryMap.get(ticket.category_id) : undefined,
      priorityName: ticket.priority_id ? priorityMap.get(ticket.priority_id) : undefined,
      creatorName: ticket.creator_id ? userMap.get(ticket.creator_id) : undefined,
      notes: ticketNotes.get(ticket.id) || "",
    }));

    return enrichedData;
  }

  // TICKET CATEGORIES CRUD
  async createTicketCategory(category: Omit<TicketCategory, "id">): Promise<TicketCategory> {
    return this.unwrap(
      await this.supabase.from("ticket_categories").insert(category).select().single(),
      "createTicketCategory",
    );
  }

  async getTicketCategories(): Promise<TicketCategory[]> {
    return this.unwrapList(
      await this.supabase.from("ticket_categories").select("*").order("name"),
      "getTicketCategories",
    );
  }

  async updateTicketCategory(id: number, updates: Partial<TicketCategory>): Promise<TicketCategory> {
    return this.unwrap(
      await this.supabase.from("ticket_categories").update(updates).eq("id", id).select().single(),
      "updateTicketCategory",
    );
  }

  async deleteTicketCategory(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("ticket_categories").delete().eq("id", id), "deleteTicketCategory");
  }

  // TICKET PRIORITIES CRUD
  async createTicketPriority(priority: Omit<TicketPriority, "id">): Promise<TicketPriority> {
    return this.unwrap(
      await this.supabase.from("ticket_priorities").insert(priority).select().single(),
      "createTicketPriority",
    );
  }

  async getTicketPriorities(): Promise<TicketPriority[]> {
    return this.unwrapList(
      await this.supabase.from("ticket_priorities").select("*").order("name"),
      "getTicketPriorities",
    );
  }

  async updateTicketPriority(id: number, updates: Partial<TicketPriority>): Promise<TicketPriority> {
    return this.unwrap(
      await this.supabase.from("ticket_priorities").update(updates).eq("id", id).select().single(),
      "updateTicketPriority",
    );
  }

  async deleteTicketPriority(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("ticket_priorities").delete().eq("id", id), "deleteTicketPriority");
  }

  // TICKET COMMENTS CRUD
  async createTicketComment(comment: Omit<TicketComment, "id" | "created_at">): Promise<TicketComment> {
    return this.unwrap(
      await this.supabase.from("ticket_comments").insert(comment).select().single(),
      "createTicketComment",
    );
  }

  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return this.unwrapList(
      await this.supabase
        .from("ticket_comments")
        .select(
          `
      id,
      ticket_id,
      user_id,
      content,
      created_at,
      users!user_id(
        name,
        image_url
      )
    `,
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      "getTicketComments",
    );
  }

  async updateTicketComment(id: number, updates: Partial<TicketComment>): Promise<TicketComment> {
    return this.unwrap(
      await this.supabase.from("ticket_comments").update(updates).eq("id", id).select().single(),
      "updateTicketComment",
    );
  }

  async deleteTicketComment(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("ticket_comments").delete().eq("id", id), "deleteTicketComment");
  }

  // TICKET NOTES CRUD
  async createTicketNote(note: Omit<TicketNote, "id" | "created_at">): Promise<TicketNote> {
    return this.unwrap(await this.supabase.from("ticket_notes").insert(note).select().single(), "createTicketNote");
  }

  async getTicketNotes(ticketId: string): Promise<TicketNote[]> {
    return this.unwrapList(
      await this.supabase
        .from("ticket_notes")
        .select(
          `
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        users!user_id(
          id,
          name,
          email
        )
      `,
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      "getTicketNotes",
    );
  }

  async updateTicketNote(id: number, updates: Partial<TicketNote>): Promise<TicketNote> {
    return this.unwrap(
      await this.supabase.from("ticket_notes").update(updates).eq("id", id).select().single(),
      "updateTicketNote",
    );
  }

  async deleteTicketNote(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("ticket_notes").delete().eq("id", id), "deleteTicketNote");
  }

  // TICKET ATTACHMENTS CRUD
  async createTicketAttachment(attachment: Omit<TicketAttachment, "id" | "created_at">): Promise<TicketAttachment> {
    return this.unwrap(
      await this.supabase.from("ticket_attachments").insert(attachment).select().single(),
      "createTicketAttachment",
    );
  }

  async getTicketAttachments(ticketId: string): Promise<TicketAttachment[]> {
    return this.unwrapList(
      await this.supabase
        .from("ticket_attachments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false }),
      "getTicketAttachments",
    );
  }

  async deleteTicketAttachment(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("ticket_attachments").delete().eq("id", id), "deleteTicketAttachment");
  }

  // Write seam (ADR-0002): uploads the file then records it, returning the
  // created attachment and throwing on either the storage or the insert error.
  async uploadAttachment(ticketId: string, file: File, uploadedBy?: string): Promise<TicketAttachment> {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `tickets/${ticketId}/${Date.now()}_${sanitizedName}`;

    const { error: storageError } = await this.supabase.storage
      .from("attachments")
      .upload(filePath, file, { upsert: false });

    if (storageError) throw new Error(`ticketService.uploadAttachment failed: ${storageError.message}`);

    return this.unwrap(
      await this.supabase
        .from("ticket_attachments")
        .insert({ ticket_id: ticketId, url: filePath, filename: file.name, uploaded_by: uploadedBy })
        .select()
        .single(),
      "uploadAttachment",
    );
  }

  // Best-effort storage cleanup (its failure is non-fatal), then the row delete
  // throws on error like the rest of the write seam (ADR-0002).
  async deleteAttachmentWithFile(id: number, filePath: string): Promise<void> {
    await this.supabase.storage.from("attachments").remove([filePath]);
    this.unwrap(await this.supabase.from("ticket_attachments").delete().eq("id", id), "deleteAttachmentWithFile");
  }

  getAttachmentPublicUrl(filePath: string) {
    const { data } = this.supabase.storage.from("attachments").getPublicUrl(filePath);
    return data.publicUrl;
  }

  // ASSIGNEES — read-only here; assignee writes live in user-service
  async getAssignees(): Promise<Assignee[]> {
    return this.unwrapList(await this.supabase.from("assignee").select("*").order("name"), "getAssignees");
  }

  // USERS — read-only here; user writes live in user-service
  async getUsers(): Promise<User[]> {
    return this.unwrapList(await this.supabase.from("users").select("*").order("name"), "getUsers");
  }

  // DASHBOARD OPTIMIZED METHODS
  // Read seam (ADR-0002): returns the computed dashboard stats and throws on a
  // data-access error, never Supabase's { data, error } envelope.
  async getDashboardStats(): Promise<DashboardStats> {
    const tickets = this.unwrapList(
      await this.supabase.from("tickets").select(`
        id,
        status,
        priority_id,
        ticket_priorities(name)
      `),
      "getDashboardStats",
    );

    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      closed: tickets.filter((ticket) => ticket.status === "CLOSED").length,
      highPriority: tickets.filter((ticket) => {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const priorities = ticket.ticket_priorities as any;
        return Array.isArray(priorities)
          ? priorities[0]?.name?.toUpperCase() === "HIGH"
          : priorities?.name?.toUpperCase() === "HIGH";
      }).length,
    };
  }

  // Read seam (ADR-0002): returns normalized domain Tickets and throws on a
  // data-access error. Callers get plain priority/assignee fields, never
  // Supabase's { data, error } envelope or its T | T[] join shape. This is the
  // single parameterized reader that replaced the three near-duplicate
  // *WithDetails readers.
  async readTicketsWithDetails(options?: {
    limit?: number;
    status?: string;
    creator_id?: string;
    assignee_id?: number;
  }): Promise<TicketWithDetails[]> {
    let query = this.supabase.from("tickets").select(`
        id,
        ticket_id,
        title,
        description,
        status,
        created_at,
        updated_at,
        closed_at,
        site,
        system,
        error_code,
        category_id,
        priority_id,
        creator_id,
        assignee_id,
        ticket_categories(id, name),
        ticket_priorities(id, name),
        assignee(id, name),
        users!creator_id(id, name, email)
      `);

    if (options?.status) query = query.eq("status", options.status);
    if (options?.creator_id) query = query.eq("creator_id", options.creator_id);
    if (options?.assignee_id) query = query.eq("assignee_id", options.assignee_id);

    query = query.order("created_at", { ascending: false });
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw new Error(`ticketService.readTicketsWithDetails failed: ${error.message}`);
    return (data ?? []).map(normalizeTicketRow);
  }

  // DEMARCATION CRUD
  async createDemarcation(demarcation: Omit<Demarcation, "id">): Promise<Demarcation> {
    return this.unwrap(
      await this.supabase.from("demarcations").insert(demarcation).select().single(),
      "createDemarcation",
    );
  }

  async getDemarcations(): Promise<Demarcation[]> {
    return this.unwrapList(await this.supabase.from("demarcations").select("*").order("name"), "getDemarcations");
  }

  async updateDemarcation(id: number, updates: Partial<Demarcation>): Promise<Demarcation> {
    return this.unwrap(
      await this.supabase.from("demarcations").update(updates).eq("id", id).select().single(),
      "updateDemarcation",
    );
  }

  async deleteDemarcation(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("demarcations").delete().eq("id", id), "deleteDemarcation");
  }

  // LINK CRUD
  async createLink(link: Omit<Link, "id">): Promise<Link> {
    return this.unwrap(await this.supabase.from("links").insert(link).select().single(), "createLink");
  }

  async getLinks(): Promise<Link[]> {
    return this.unwrapList(await this.supabase.from("links").select("*").order("name"), "getLinks");
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link> {
    return this.unwrap(
      await this.supabase.from("links").update(updates).eq("id", id).select().single(),
      "updateLink",
    );
  }

  async deleteLink(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("links").delete().eq("id", id), "deleteLink");
  }

  // SITE CRUD
  async createSite(site: Omit<Site, "id">): Promise<Site> {
    return this.unwrap(await this.supabase.from("sites").insert(site).select().single(), "createSite");
  }

  async getSites(): Promise<Site[]> {
    return this.unwrapList(await this.supabase.from("sites").select("*").order("name"), "getSites");
  }

  async updateSite(id: number, updates: Partial<Site>): Promise<Site> {
    return this.unwrap(
      await this.supabase.from("sites").update(updates).eq("id", id).select().single(),
      "updateSite",
    );
  }

  async deleteSite(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("sites").delete().eq("id", id), "deleteSite");
  }

  // SERVICE TYPE CRUD
  async createServiceType(serviceType: Omit<ServiceType, "id">): Promise<ServiceType> {
    return this.unwrap(
      await this.supabase.from("service_types").insert(serviceType).select().single(),
      "createServiceType",
    );
  }

  async getServiceTypes(): Promise<ServiceType[]> {
    return this.unwrapList(await this.supabase.from("service_types").select("*").order("name"), "getServiceTypes");
  }

  async updateServiceType(id: number, updates: Partial<ServiceType>): Promise<ServiceType> {
    return this.unwrap(
      await this.supabase.from("service_types").update(updates).eq("id", id).select().single(),
      "updateServiceType",
    );
  }

  async deleteServiceType(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("service_types").delete().eq("id", id), "deleteServiceType");
  }

  // DETECTION SOURCE CRUD
  async createDetectionSource(detectionSource: Omit<DetectionSource, "id">): Promise<DetectionSource> {
    return this.unwrap(
      await this.supabase.from("detection_sources").insert(detectionSource).select().single(),
      "createDetectionSource",
    );
  }

  async getDetectionSources(): Promise<DetectionSource[]> {
    return this.unwrapList(
      await this.supabase.from("detection_sources").select("*").order("name"),
      "getDetectionSources",
    );
  }

  async updateDetectionSource(id: number, updates: Partial<DetectionSource>): Promise<DetectionSource> {
    return this.unwrap(
      await this.supabase.from("detection_sources").update(updates).eq("id", id).select().single(),
      "updateDetectionSource",
    );
  }

  async deleteDetectionSource(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("detection_sources").delete().eq("id", id), "deleteDetectionSource");
  }

  // TRAFFIC IMPACT CRUD
  async createTrafficImpact(trafficImpact: Omit<TrafficImpact, "id">): Promise<TrafficImpact> {
    return this.unwrap(
      await this.supabase.from("traffic_impacts").insert(trafficImpact).select().single(),
      "createTrafficImpact",
    );
  }

  async getTrafficImpacts(): Promise<TrafficImpact[]> {
    return this.unwrapList(await this.supabase.from("traffic_impacts").select("*").order("name"), "getTrafficImpacts");
  }

  async updateTrafficImpact(id: number, updates: Partial<TrafficImpact>): Promise<TrafficImpact> {
    return this.unwrap(
      await this.supabase.from("traffic_impacts").update(updates).eq("id", id).select().single(),
      "updateTrafficImpact",
    );
  }

  async deleteTrafficImpact(id: number): Promise<void> {
    this.unwrap(await this.supabase.from("traffic_impacts").delete().eq("id", id), "deleteTrafficImpact");
  }
}

// Export singleton instance
export const ticketService = new TicketService();
