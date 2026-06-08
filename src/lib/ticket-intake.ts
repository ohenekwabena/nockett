import {
  ticketService,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type Assignee,
  type Demarcation,
  type Link,
  type Site,
  type ServiceType,
  type DetectionSource,
  type TrafficImpact,
} from "@/services/ticket-service";

/**
 * Ticket intake: the single owner of "take in a new Ticket" — its required
 * fields and the create -> note -> attachments orchestration.
 *
 * Before this module the whole sequence lived inline in
 * `create-ticket-modal.tsx`, tangled with 60+ form-state hooks, so the intake
 * rules (what's required, the order of the follow-on writes, what counts as
 * success) could only be exercised by mounting the modal. Here they are plain
 * functions, unit-testable without React.
 *
 * Contract:
 * - The reads/writes go through `ticketService`, which returns unwrapped values
 *   and throws on a data-access error (ADR-0002).
 * - Notification is NOT done here. `ticketService.createTicket` already notifies
 *   the creator via the ticket-notifications policy module (NOC-6); intake owns
 *   only the create/note/attachment sequence around that.
 *
 * Partial-failure semantics ({@link submitTicket}):
 * - Creating the Ticket is the atomic success boundary — if it throws, intake
 *   throws and nothing was created.
 * - Once the Ticket exists, the initial note and each attachment are best-effort
 *   follow-ons: a failure is captured as a {@link TicketIntakeResult} warning,
 *   not re-thrown, because the Ticket is already real and reporting "creation
 *   failed" would be a lie. Callers decide how loudly to surface the warnings.
 */

/** The writable fields of a Ticket — everything the create/edit forms assemble. */
export type TicketFields = Omit<Ticket, "id" | "created_at" | "updated_at">;

/** Every reference-entity option list a Ticket form needs to render its dropdowns. */
export interface ReferenceOptions {
  categories: TicketCategory[];
  priorities: TicketPriority[];
  assignees: Assignee[];
  demarcations: Demarcation[];
  links: Link[];
  sites: Site[];
  serviceTypes: ServiceType[];
  detectionSources: DetectionSource[];
  trafficImpacts: TrafficImpact[];
}

/** A new Ticket plus its optional follow-on note and attachments. */
export interface NewTicketDraft {
  fields: TicketFields;
  /** Optional first note; created only when non-blank. */
  initialNote?: string;
  /** Files to attach after the Ticket is created. */
  attachments?: File[];
  /** The acting User's id, recorded as the note author / attachment uploader. */
  actorId?: string;
}

/** The outcome of {@link submitTicket}: the created Ticket plus follow-on results. */
export interface TicketIntakeResult {
  ticket: Ticket;
  noteCreated: boolean;
  attachmentsUploaded: number;
  attachmentsFailed: number;
  /** Human-readable notes about non-fatal follow-on failures (note/attachments). */
  warnings: string[];
}

/**
 * Validate a draft's fields against the intake rules. Returns an error message
 * to show the user, or null when the draft may be submitted.
 */
export function validateTicketDraft(fields: TicketFields): string | null {
  if (!fields.title?.trim()) return "Title is required";
  return null;
}

/**
 * Load every reference-entity option list a Ticket form needs, in one call.
 * Folds the nine separate reader calls (which each throw on error, ADR-0002)
 * into a single parallel read so the modal and the import template share one
 * intake read path instead of nine ad-hoc `Promise.all` lists.
 */
export async function loadReferenceOptions(): Promise<ReferenceOptions> {
  const [
    categories,
    priorities,
    assignees,
    demarcations,
    links,
    sites,
    serviceTypes,
    detectionSources,
    trafficImpacts,
  ] = await Promise.all([
    ticketService.getTicketCategories(),
    ticketService.getTicketPriorities(),
    ticketService.getAssignees(),
    ticketService.getDemarcations(),
    ticketService.getLinks(),
    ticketService.getSites(),
    ticketService.getServiceTypes(),
    ticketService.getDetectionSources(),
    ticketService.getTrafficImpacts(),
  ]);

  return {
    categories,
    priorities,
    assignees,
    demarcations,
    links,
    sites,
    serviceTypes,
    detectionSources,
    trafficImpacts,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Take in a new Ticket: validate, create it, then attach the optional initial
 * note and any files. Creating the Ticket throws on failure (nothing is
 * created); note/attachment failures are returned as warnings rather than
 * thrown, since the Ticket already exists. See the module-level contract.
 */
export async function submitTicket(draft: NewTicketDraft): Promise<TicketIntakeResult> {
  const validationError = validateTicketDraft(draft.fields);
  if (validationError) throw new Error(validationError);

  // The Ticket itself is the success boundary — let a failure here propagate.
  // (createTicket also notifies the creator internally, per NOC-6.)
  const ticket = await ticketService.createTicket(draft.fields);

  const warnings: string[] = [];

  let noteCreated = false;
  const note = draft.initialNote?.trim();
  if (note) {
    try {
      await ticketService.createTicketNote({
        ticket_id: ticket.id,
        content: note,
        user_id: draft.actorId,
      });
      noteCreated = true;
    } catch (error) {
      warnings.push(`Ticket created, but the initial note could not be saved: ${errorMessage(error)}`);
    }
  }

  let attachmentsUploaded = 0;
  let attachmentsFailed = 0;
  const attachments = draft.attachments ?? [];
  if (attachments.length > 0) {
    // Upload in parallel (as the modal did) but settle each independently so one
    // bad file doesn't abort the rest and every failure is counted.
    const results = await Promise.allSettled(
      attachments.map((file) => ticketService.uploadAttachment(ticket.id, file, draft.actorId)),
    );
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        attachmentsUploaded += 1;
      } else {
        attachmentsFailed += 1;
        warnings.push(`Attachment "${attachments[index].name}" failed to upload: ${errorMessage(result.reason)}`);
      }
    });
  }

  return { ticket, noteCreated, attachmentsUploaded, attachmentsFailed, warnings };
}
