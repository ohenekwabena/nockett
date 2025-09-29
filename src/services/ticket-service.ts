import { createClient } from "@/api/supabase/client";

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
}

export interface TicketNote {
  id: number;
  ticket_id?: string;
  user_id?: string;
  content?: string;
  created_at?: string;
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

export class TicketService {
  private supabase = createClient();

  // TICKETS CRUD
  async createTicket(ticket: Omit<Ticket, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase.from("tickets").insert(ticket).select().single();
    return { data, error };
  }

  async getTickets(filters?: { status?: string; creator_id?: string; assignee_id?: number }) {
    let query = this.supabase.from("tickets").select("*");

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.creator_id) query = query.eq("creator_id", filters.creator_id);
    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    return { data, error };
  }

  async getTicketById(id: string) {
    const { data, error } = await this.supabase.from("tickets").select("*").eq("id", id).single();
    return { data, error };
  }

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const { data, error } = await this.supabase
      .from("tickets")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }

  async deleteTicket(id: string) {
    const { data, error } = await this.supabase.from("tickets").delete().eq("id", id);
    return { data, error };
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
      .select("*")
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
      .select("*")
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
      `
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
      `
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
      `
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
