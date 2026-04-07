import { createClient } from "@/api/supabase/client";
import { sendEmail } from "../lib/email-service";
import { TicketCreatedEmailProps } from "../emails/TicketCreatedEmail";
import { TicketUpdatedEmailProps } from "../emails/TicketUpdatedEmail";
import { TicketClosedEmailProps } from "../emails/TicketClosedEmail";

// Type definitions
export interface Ticket {
  id: string;
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

export interface TicketHistory {
  id: number;
  ticket_id?: string;
  action: string;
  user_id?: string;
  timestamp?: string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

export interface TicketSLATimer {
  id: number;
  ticket_id?: string;
  started_at?: string;
  breached_at?: string;
  escalated_at?: string;
}

export interface Assignee {
  id: number;
  name: string;
}

export interface Department {
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

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  id: number;
  user_id?: string;
  role_id?: number;
  assigned_at?: string;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  description?: string;
  solution?: string;
  related_ticket_ids?: string[];
  tags?: string[];
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

export class TicketService {
  private supabase = createClient();

  // Transform snake_case database columns to camelCase
  private transformTicket(dbTicket: any): Ticket {
    return {
      id: dbTicket.id,
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
  async createTicket(ticket: Omit<Ticket, "id" | "created_at" | "updated_at">) {
    const snakeCaseTicket = this.toSnakeCase(ticket as Partial<Ticket>);
    const { data, error } = await this.supabase.from("tickets").insert(snakeCaseTicket).select().single();
    // Transform response back to camelCase
    if (data) {
      // Send email notification for ticket creation (react-email template)
      try {
        const creatorEmail = ticket.creator_id ? await this.getUserEmail(ticket.creator_id) : "admin@yourdomain.com";
        let creatorName: string | undefined = undefined;
        if (ticket.creator_id) {
          const userResult = await this.getUserById(ticket.creator_id);
          creatorName = userResult.data?.name;
        }
        const template: TicketCreatedEmailProps = {
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          creatorName: creatorName,
        };
        await sendEmail({
          to: creatorEmail,
          subject: `Ticket Created: ${ticket.title}`,
          template: { type: "ticket-created", props: template },
        });
      } catch (e) {
        console.error("Failed to send ticket creation email", e);
      }
      return { data: this.transformTicket(data), error };
    }
    return { data, error };
  }

  async getTickets(filters?: { status?: string; creator_id?: string; assignee_id?: number }) {
    let query = this.supabase.from("tickets").select("*");

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.creator_id) query = query.eq("creator_id", filters.creator_id);
    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    // Transform all tickets from snake_case to camelCase
    if (data && Array.isArray(data)) {
      return { data: data.map((ticket) => this.transformTicket(ticket)), error };
    }
    return { data, error };
  }

  async getTicketById(id: string) {
    const { data, error } = await this.supabase.from("tickets").select("*").eq("id", id).single();
    // Transform single ticket from snake_case to camelCase
    if (data) {
      return { data: this.transformTicket(data), error };
    }
    return { data, error };
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

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const snakeCaseUpdates = this.toSnakeCase(updates);
    const { data, error } = await this.supabase
      .from("tickets")
      .update({ ...snakeCaseUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    // Transform response back to camelCase
    if (data) {
      // Send email notification for status change or closure (react-email template)
      try {
        const updatedTicket = this.transformTicket(data);
        if (typeof updates.status !== "undefined") {
          const creatorEmail = updatedTicket.creator_id
            ? await this.getUserEmail(updatedTicket.creator_id)
            : "admin@yourdomain.com";
          let updaterName: string | undefined = undefined;
          if (updatedTicket.assignee_id) {
            updaterName = await this.getAssigneeName(updatedTicket.assignee_id);
          }
          if (updatedTicket.status === "CLOSED") {
            const closedTemplate: TicketClosedEmailProps = {
              title: updatedTicket.title,
              closerName: updaterName,
            };
            await sendEmail({
              to: creatorEmail,
              subject: `Ticket Closed: ${updatedTicket.title}`,
              template: { type: "ticket-closed", props: closedTemplate },
            });
          } else {
            const oldStatus = updates.status ?? "";
            const updatedTemplate: TicketUpdatedEmailProps = {
              title: updatedTicket.title,
              oldStatus: oldStatus,
              newStatus: updatedTicket.status,
              updaterName: updaterName,
            };
            await sendEmail({
              to: creatorEmail,
              subject: `Ticket Status Updated: ${updatedTicket.title}`,
              template: { type: "ticket-updated", props: updatedTemplate },
            });
          }
        }
      } catch (e) {
        console.error("Failed to send ticket update email", e);
      }
      return { data: this.transformTicket(data), error };
    }
    return { data, error };
  }

  // Helper to get assignee name by id
  async getAssigneeName(assigneeId: number): Promise<string | undefined> {
    const { data } = await this.supabase.from("assignees").select("name").eq("id", assigneeId).single();
    return data?.name;
  }

  // Helper to get user email by id
  async getUserEmail(userId: string): Promise<string> {
    const { data } = await this.supabase.from("users").select("email").eq("id", userId).single();
    return data?.email || "admin@yourdomain.com";
  }
  async deleteTicket(id: string) {
    const { data, error } = await this.supabase.from("tickets").delete().eq("id", id);
    return { data, error };
  }

  // EXPORT METHOD FOR EXCEL
  async getTicketsForExport() {
    const { data: tickets, error: ticketsError } = await this.getTickets();
    if (ticketsError || !tickets) {
      return { data: null, error: ticketsError };
    }

    // Fetch assignees and categories for mapping
    const { data: assignees } = await this.getAssignees();
    const { data: categories } = await this.getTicketCategories();
    const { data: users } = await this.getUsers();

    // Create maps for quick lookup
    const assigneeMap = new Map((assignees || []).map((a) => [a.id, a.name]));
    const categoryMap = new Map((categories || []).map((c) => [c.id, c.name]));
    const userMap = new Map((users || []).map((u) => [u.id, u.name]));

    // Get all notes for all tickets
    const ticketNotes = new Map<string, string>();
    for (const ticket of tickets) {
      const { data: notes } = await this.getTicketNotes(ticket.id);
      if (notes && notes.length > 0) {
        ticketNotes.set(ticket.id, notes.map((n) => n.content).join("\n"));
      }
    }

    // Enrich tickets with additional data
    const enrichedData = tickets.map((ticket) => ({
      ticket,
      assigneeName: ticket.assignee_id ? assigneeMap.get(ticket.assignee_id) : undefined,
      categoryName: ticket.category_id ? categoryMap.get(ticket.category_id) : undefined,
      creatorName: ticket.creator_id ? userMap.get(ticket.creator_id) : undefined,
      notes: ticketNotes.get(ticket.id) || "",
    }));

    return { data: enrichedData, error: null };
  }

  // TICKET CATEGORIES CRUD
  async createTicketCategory(category: Omit<TicketCategory, "id">) {
    const { data, error } = await this.supabase.from("ticket_categories").insert(category).select().single();
    return { data, error };
  }

  async getTicketCategories() {
    const { data, error } = await this.supabase.from("ticket_categories").select("*").order("name");
    return { data, error };
  }

  async updateTicketCategory(id: number, updates: Partial<TicketCategory>) {
    const { data, error } = await this.supabase
      .from("ticket_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }

  async deleteTicketCategory(id: number) {
    const { data, error } = await this.supabase.from("ticket_categories").delete().eq("id", id);
    return { data, error };
  }

  // TICKET PRIORITIES CRUD
  async createTicketPriority(priority: Omit<TicketPriority, "id">) {
    const { data, error } = await this.supabase.from("ticket_priorities").insert(priority).select().single();
    return { data, error };
  }

  async getTicketPriorities() {
    const { data, error } = await this.supabase.from("ticket_priorities").select("*").order("name");
    return { data, error };
  }

  async updateTicketPriority(id: number, updates: Partial<TicketPriority>) {
    const { data, error } = await this.supabase
      .from("ticket_priorities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }

  async deleteTicketPriority(id: number) {
    const { data, error } = await this.supabase.from("ticket_priorities").delete().eq("id", id);
    return { data, error };
  }

  // TICKET COMMENTS CRUD
  async createTicketComment(comment: Omit<TicketComment, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("ticket_comments").insert(comment).select().single();
    return { data, error };
  }

  async getTicketComments(ticketId: string) {
    const { data, error } = await this.supabase
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
      .order("created_at", { ascending: true });
    return { data, error };
  }

  async updateTicketComment(id: number, updates: Partial<TicketComment>) {
    const { data, error } = await this.supabase.from("ticket_comments").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteTicketComment(id: number) {
    const { data, error } = await this.supabase.from("ticket_comments").delete().eq("id", id);
    return { data, error };
  }

  // TICKET NOTES CRUD
  async createTicketNote(note: Omit<TicketNote, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("ticket_notes").insert(note).select().single();
    return { data, error };
  }

  async getTicketNotes(ticketId: string) {
    const { data, error } = await this.supabase
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
      .order("created_at", { ascending: true });
    return { data, error };
  }

  async updateTicketNote(id: number, updates: Partial<TicketNote>) {
    const { data, error } = await this.supabase.from("ticket_notes").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteTicketNote(id: number) {
    const { data, error } = await this.supabase.from("ticket_notes").delete().eq("id", id);
    return { data, error };
  }

  // TICKET ATTACHMENTS CRUD
  async createTicketAttachment(attachment: Omit<TicketAttachment, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("ticket_attachments").insert(attachment).select().single();
    return { data, error };
  }

  async getTicketAttachments(ticketId: string) {
    const { data, error } = await this.supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });
    return { data, error };
  }

  async deleteTicketAttachment(id: number) {
    const { data, error } = await this.supabase.from("ticket_attachments").delete().eq("id", id);
    return { data, error };
  }

  async uploadAttachment(ticketId: string, file: File, uploadedBy?: string) {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `tickets/${ticketId}/${Date.now()}_${sanitizedName}`;

    const { error: storageError } = await this.supabase.storage
      .from("attachments")
      .upload(filePath, file, { upsert: false });

    if (storageError) return { data: null, error: storageError };

    const { data: record, error: dbError } = await this.supabase
      .from("ticket_attachments")
      .insert({ ticket_id: ticketId, url: filePath, filename: file.name, uploaded_by: uploadedBy })
      .select()
      .single();

    return { data: record, error: dbError };
  }

  async deleteAttachmentWithFile(id: number, filePath: string) {
    await this.supabase.storage.from("attachments").remove([filePath]);
    const { data, error } = await this.supabase.from("ticket_attachments").delete().eq("id", id);
    return { data, error };
  }

  getAttachmentPublicUrl(filePath: string) {
    const { data } = this.supabase.storage.from("attachments").getPublicUrl(filePath);
    return data.publicUrl;
  }

  // TICKET HISTORY CRUD
  async createTicketHistory(history: Omit<TicketHistory, "id" | "timestamp">) {
    const { data, error } = await this.supabase.from("ticket_history").insert(history).select().single();
    return { data, error };
  }

  async getTicketHistory(ticketId: string) {
    const { data, error } = await this.supabase
      .from("ticket_history")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("timestamp", { ascending: false });
    return { data, error };
  }

  // TICKET SLA TIMERS CRUD
  async createTicketSLATimer(timer: Omit<TicketSLATimer, "id">) {
    const { data, error } = await this.supabase.from("ticket_sla_timers").insert(timer).select().single();
    return { data, error };
  }

  async getTicketSLATimer(ticketId: string) {
    const { data, error } = await this.supabase
      .from("ticket_sla_timers")
      .select("*")
      .eq("ticket_id", ticketId)
      .single();
    return { data, error };
  }

  async updateTicketSLATimer(id: number, updates: Partial<TicketSLATimer>) {
    const { data, error } = await this.supabase
      .from("ticket_sla_timers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }

  // ASSIGNEES CRUD
  async createAssignee(assignee: Omit<Assignee, "id">) {
    const { data, error } = await this.supabase.from("assignee").insert(assignee).select().single();
    return { data, error };
  }

  async getAssignees() {
    const { data, error } = await this.supabase.from("assignee").select("*").order("name");
    return { data, error };
  }

  async updateAssignee(id: number, updates: Partial<Assignee>) {
    const { data, error } = await this.supabase.from("assignee").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteAssignee(id: number) {
    const { data, error } = await this.supabase.from("assignee").delete().eq("id", id);
    return { data, error };
  }

  // DEPARTMENTS CRUD
  async createDepartment(department: Omit<Department, "id">) {
    const { data, error } = await this.supabase.from("departments").insert(department).select().single();
    return { data, error };
  }

  async getDepartments() {
    const { data, error } = await this.supabase.from("departments").select("*").order("name");
    return { data, error };
  }

  async updateDepartment(id: number, updates: Partial<Department>) {
    const { data, error } = await this.supabase.from("departments").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteDepartment(id: number) {
    const { data, error } = await this.supabase.from("departments").delete().eq("id", id);
    return { data, error };
  }

  // USERS CRUD
  async createUser(user: Omit<User, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("users").insert(user).select().single();
    return { data, error };
  }

  async getUsers() {
    const { data, error } = await this.supabase.from("users").select("*").order("name");
    return { data, error };
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();
    return { data, error };
  }

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await this.supabase.from("users").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteUser(id: string) {
    const { data, error } = await this.supabase.from("users").delete().eq("id", id);
    return { data, error };
  }

  // ROLES CRUD
  async createRole(role: Omit<Role, "id">) {
    const { data, error } = await this.supabase.from("roles").insert(role).select().single();
    return { data, error };
  }

  async getRoles() {
    const { data, error } = await this.supabase.from("roles").select("*").order("name");
    return { data, error };
  }

  async updateRole(id: number, updates: Partial<Role>) {
    const { data, error } = await this.supabase.from("roles").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteRole(id: number) {
    const { data, error } = await this.supabase.from("roles").delete().eq("id", id);
    return { data, error };
  }

  // USER ROLES CRUD
  async assignUserRole(userRole: Omit<UserRole, "id" | "assigned_at">) {
    const { data, error } = await this.supabase.from("user_roles").insert(userRole).select().single();
    return { data, error };
  }

  async getUserRoles(userId: string) {
    const { data, error } = await this.supabase.from("user_roles").select("*, roles(*)").eq("user_id", userId);
    return { data, error };
  }

  async removeUserRole(id: number) {
    const { data, error } = await this.supabase.from("user_roles").delete().eq("id", id);
    return { data, error };
  }

  // KNOWLEDGE BASE CRUD
  async createKnowledgeBase(kb: Omit<KnowledgeBase, "id">) {
    const { data, error } = await this.supabase.from("knowledge_base").insert(kb).select().single();
    return { data, error };
  }

  async getKnowledgeBase(filters?: { tags?: string[] }) {
    let query = this.supabase.from("knowledge_base").select("*");

    if (filters?.tags?.length) {
      query = query.overlaps("tags", filters.tags);
    }

    const { data, error } = await query.order("title");
    return { data, error };
  }

  async getKnowledgeBaseById(id: number) {
    const { data, error } = await this.supabase.from("knowledge_base").select("*").eq("id", id).single();
    return { data, error };
  }

  async updateKnowledgeBase(id: number, updates: Partial<KnowledgeBase>) {
    const { data, error } = await this.supabase.from("knowledge_base").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteKnowledgeBase(id: number) {
    const { data, error } = await this.supabase.from("knowledge_base").delete().eq("id", id);
    return { data, error };
  }

  // DASHBOARD OPTIMIZED METHODS
  async getDashboardStats() {
    const { data, error } = await this.supabase.from("tickets").select(`
        id,
        status, 
        priority_id,
        ticket_priorities(name)
      `);

    if (error) return { data: null, error };

    // Calculate stats from the data
    const stats = {
      total: data.length,
      open: data.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: data.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      closed: data.filter((ticket) => ticket.status === "CLOSED").length,
      highPriority: data.filter((ticket) => {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const priorities = ticket.ticket_priorities as any;
        return Array.isArray(priorities)
          ? priorities[0]?.name?.toUpperCase() === "HIGH"
          : priorities?.name?.toUpperCase() === "HIGH";
      }).length,
    };

    return { data: stats, error: null };
  }

  async getRecentTicketsWithDetails(limit: number = 5) {
    const { data, error } = await this.supabase
      .from("tickets")
      .select(
        `
        id,
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
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data, error };
  }

  // OPTIMIZED METHODS
  async getTicketsWithDetails(filters?: { status?: string; creator_id?: string; assignee_id?: number }) {
    let query = this.supabase.from("tickets").select(`
        id,
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

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.creator_id) query = query.eq("creator_id", filters.creator_id);
    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    return { data, error };
  }

  async getTicketByIdWithDetails(id: string) {
    const { data, error } = await this.supabase
      .from("tickets")
      .select(
        `
        id,
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
      `,
      )
      .eq("id", id)
      .single();
    return { data, error };
  }

  // HELPER METHODS
  async getTicketWithDetails(ticketId: string) {
    const { data, error } = await this.supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_categories(name),
        ticket_priorities(name),
        assignee(name),
        users!creator_id(name, email)
      `,
      )
      .eq("id", ticketId)
      .single();
    return { data, error };
  }

  async getTicketStats(userId?: string) {
    let query = this.supabase.from("tickets").select("status");

    if (userId) {
      query = query.eq("creator_id", userId);
    }

    const { data, error } = await query;

    if (error) return { data: null, error };

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = data.reduce((acc: any, ticket: any) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    return { data: stats, error: null };
  }

  async searchTickets(searchTerm: string) {
    const { data, error } = await this.supabase
      .from("tickets")
      .select("*")
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });
    return { data, error };
  }

  // Search method with filters for specific fields
  async searchTicketsWithFilters(filters: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignee?: string;
    creator?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = this.supabase.from("tickets").select(`
      id,
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
      ticket_number,
      ticket_categories(id, name),
      ticket_priorities(id, name),
      assignee(id, name),
      users!creator_id(id, name, email)
    `);

    // Apply search term filter
    if (filters.searchTerm?.trim()) {
      const term = filters.searchTerm.trim();
      query = query.or(`
        title.ilike.%${term}%,
        description.ilike.%${term}%,
        id.ilike.%${term}%,
        ticket_number.ilike.%${term}%,
        site.ilike.%${term}%,
        system.ilike.%${term}%,
        error_code.ilike.%${term}%
      `);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    // Apply assignee filter
    if (filters.assignee) {
      query = query.eq("assignee_id", parseInt(filters.assignee));
    }

    // Apply creator filter
    if (filters.creator) {
      query = query.eq("creator_id", filters.creator);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    return { data, error };
  }

  // Quick search for autocomplete suggestions
  async getSearchSuggestions(searchTerm: string, limit: number = 5) {
    if (!searchTerm.trim()) {
      return { data: [], error: null };
    }

    const term = searchTerm.trim();

    const { data, error } = await this.supabase
      .from("tickets")
      .select(
        `
        id,
        title,
        ticket_number,
        status
      `,
      )
      .or(
        `
        title.ilike.%${term}%,
        id.ilike.%${term}%,
        ticket_number.ilike.%${term}%
      `,
      )
      .limit(limit)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  // DEMARCATION CRUD
  async createDemarcation(demarcation: Omit<Demarcation, "id">) {
    const { data, error } = await this.supabase.from("demarcations").insert(demarcation).select().single();
    return { data, error };
  }

  async getDemarcations() {
    const { data, error } = await this.supabase.from("demarcations").select("*").order("name");
    return { data, error };
  }

  async updateDemarcation(id: number, updates: Partial<Demarcation>) {
    const { data, error } = await this.supabase.from("demarcations").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteDemarcation(id: number) {
    const { data, error } = await this.supabase.from("demarcations").delete().eq("id", id);
    return { data, error };
  }

  // LINK CRUD
  async createLink(link: Omit<Link, "id">) {
    const { data, error } = await this.supabase.from("links").insert(link).select().single();
    return { data, error };
  }

  async getLinks() {
    const { data, error } = await this.supabase.from("links").select("*").order("name");
    return { data, error };
  }

  async updateLink(id: number, updates: Partial<Link>) {
    const { data, error } = await this.supabase.from("links").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteLink(id: number) {
    const { data, error } = await this.supabase.from("links").delete().eq("id", id);
    return { data, error };
  }

  // SITE CRUD
  async createSite(site: Omit<Site, "id">) {
    const { data, error } = await this.supabase.from("sites").insert(site).select().single();
    return { data, error };
  }

  async getSites() {
    const { data, error } = await this.supabase.from("sites").select("*").order("name");
    return { data, error };
  }

  async updateSite(id: number, updates: Partial<Site>) {
    const { data, error } = await this.supabase.from("sites").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteSite(id: number) {
    const { data, error } = await this.supabase.from("sites").delete().eq("id", id);
    return { data, error };
  }

  // SERVICE TYPE CRUD
  async createServiceType(serviceType: Omit<ServiceType, "id">) {
    const { data, error } = await this.supabase.from("service_types").insert(serviceType).select().single();
    return { data, error };
  }

  async getServiceTypes() {
    const { data, error } = await this.supabase.from("service_types").select("*").order("name");
    return { data, error };
  }

  async updateServiceType(id: number, updates: Partial<ServiceType>) {
    const { data, error } = await this.supabase.from("service_types").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteServiceType(id: number) {
    const { data, error } = await this.supabase.from("service_types").delete().eq("id", id);
    return { data, error };
  }

  // DETECTION SOURCE CRUD
  async createDetectionSource(detectionSource: Omit<DetectionSource, "id">) {
    const { data, error } = await this.supabase.from("detection_sources").insert(detectionSource).select().single();
    return { data, error };
  }

  async getDetectionSources() {
    const { data, error } = await this.supabase.from("detection_sources").select("*").order("name");
    return { data, error };
  }

  async updateDetectionSource(id: number, updates: Partial<DetectionSource>) {
    const { data, error } = await this.supabase
      .from("detection_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }

  async deleteDetectionSource(id: number) {
    const { data, error } = await this.supabase.from("detection_sources").delete().eq("id", id);
    return { data, error };
  }

  // TRAFFIC IMPACT CRUD
  async createTrafficImpact(trafficImpact: Omit<TrafficImpact, "id">) {
    const { data, error } = await this.supabase.from("traffic_impacts").insert(trafficImpact).select().single();
    return { data, error };
  }

  async getTrafficImpacts() {
    const { data, error } = await this.supabase.from("traffic_impacts").select("*").order("name");
    return { data, error };
  }

  async updateTrafficImpact(id: number, updates: Partial<TrafficImpact>) {
    const { data, error } = await this.supabase.from("traffic_impacts").update(updates).eq("id", id).select().single();
    return { data, error };
  }

  async deleteTrafficImpact(id: number) {
    const { data, error } = await this.supabase.from("traffic_impacts").delete().eq("id", id);
    return { data, error };
  }
}

// Export singleton instance
export const ticketService = new TicketService();

// Export individual methods for convenience
export const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  createTicketCategory,
  getTicketCategories,
  createTicketPriority,
  getTicketPriorities,
  createTicketComment,
  getTicketComments,
  createTicketNote,
  getTicketNotes,
  createTicketAttachment,
  getTicketAttachments,
  createTicketHistory,
  getTicketHistory,
  getTicketWithDetails,
  getTicketStats,
  searchTickets,
} = ticketService;
