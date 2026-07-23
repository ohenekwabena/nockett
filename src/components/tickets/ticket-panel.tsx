"use client";

/**
 * Ticket detail side panel (design ticket-detail.jsx). Replaces the old
 * full-screen ticket-details-modal: same write seams (ticketService, or the
 * owning page's optimistic update/delete callbacks passed via the shell
 * context), new 340px side-panel presentation.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ticketService,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type TicketNote,
} from "@/services/ticket-service";
import { loadReferenceOptions, type ReferenceOptions } from "@/lib/ticket-intake";
import { useAuth } from "@/context/auth-context";
import {
  Avatar,
  Btn,
  Chip,
  ConfirmDialog,
  IconBtn,
  InlineSelect,
  MIcon,
  PriorityCell,
  StatusBadge,
  STATUS_ORDER,
  fmtDate,
  fmtDT,
  statusUi,
  timeAgo,
  useNkShell,
} from "@/components/nk/ui";

/* ---------- small building blocks ---------- */

function PropRow({ label, icon, children }: { label: string; icon?: string; children: ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-l">{label}</span>
      <span className="prop-v">
        {icon && <MIcon name={icon} size={15} className="dim" />}
        {children}
      </span>
    </div>
  );
}

function EditableText({
  value,
  onSave,
  placeholder,
  textarea,
  className,
}: {
  value?: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => setDraft(value || ""), [value]);
  const commit = () => {
    setEditing(false);
    if (draft !== (value || "")) onSave(draft);
  };
  if (editing) {
    if (textarea) {
      return (
        <textarea
          className={"input inline-edit " + (className || "")}
          value={draft}
          autoFocus
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft(value || "");
              setEditing(false);
            }
          }}
        />
      );
    }
    return (
      <input
        className={"input inline-edit " + (className || "")}
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(value || "");
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <span
      className={"editable " + (className || "") + (value ? "" : " dim")}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || placeholder}
      <MIcon name="edit" size={13} className="edit-hint" />
    </span>
  );
}

/** Store shape "YYYY-MM-DDTHH:mm" for datetime-local inputs (timezone-stable). */
function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return "";
  const match = value.replace(" ", "T").match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  return match ? match[0] : "";
}

function EditableDateTime({
  value,
  onSave,
}: {
  value?: string | null;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDateTimeLocalValue(value));
  useEffect(() => setDraft(toDateTimeLocalValue(value)), [value]);
  if (editing) {
    return (
      <input
        type="datetime-local"
        className="input inline-edit"
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== toDateTimeLocalValue(value)) onSave(draft);
        }}
        onKeyDown={(event) => event.key === "Escape" && setEditing(false)}
      />
    );
  }
  return (
    <span className={"editable" + (value ? "" : " dim")} onClick={() => setEditing(true)} title="Click to edit">
      {value ? fmtDT(value) : "—"}
      <MIcon name="edit" size={13} className="edit-hint" />
    </span>
  );
}

function firstOf<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

/* ---------- the panel ---------- */

export function TicketPanel() {
  const { panelTicket, panelApi, closeTicket } = useNkShell();
  const { user, isAdmin } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [local, setLocal] = useState<any | null>(panelTicket);
  const [options, setOptions] = useState<ReferenceOptions | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [confirmComment, setConfirmComment] = useState<number | null>(null);
  const [confirmNote, setConfirmNote] = useState<number | null>(null);
  const [confirmAttachment, setConfirmAttachment] = useState<TicketAttachment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ticketId: string | undefined = panelTicket?.id;

  const loadSideData = useCallback(async (id: string) => {
    try {
      const [loadedComments, loadedNotes, loadedAttachments] = await Promise.all([
        ticketService.getTicketComments(id),
        ticketService.getTicketNotes(id),
        ticketService.getTicketAttachments(id),
      ]);
      setComments(loadedComments);
      setNotes(loadedNotes);
      setAttachments(loadedAttachments);
    } catch (error) {
      console.error("Error loading ticket details:", error);
    }
  }, []);

  const refreshTicket = useCallback(async (id: string) => {
    try {
      const fresh = await ticketService.getTicketById(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLocal((previous: any) => ({ ...previous, ...fresh }));
    } catch (error) {
      console.error("Error refreshing ticket:", error);
    }
  }, []);

  useEffect(() => {
    setLocal(panelTicket);
    setComments([]);
    setNotes([]);
    setAttachments([]);
    setCommentDraft("");
    setNoteDraft("");
    setAddingNote(false);
    if (ticketId) {
      refreshTicket(ticketId);
      loadSideData(ticketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    loadReferenceOptions()
      .then(setOptions)
      .catch((error) => console.error("Error loading reference options:", error));
  }, []);

  if (!local || !ticketId) return null;

  const applyUpdate = async (
    server: Partial<Ticket>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optimistic: any,
    message?: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLocal((previous: any) => ({ ...previous, ...optimistic }));
    try {
      if (panelApi?.update) {
        await panelApi.update(ticketId, optimistic, server);
      } else {
        // The write seam throws on failure (ADR-0002); updateTicket owns the
        // status-change notification emails.
        await ticketService.updateTicket(ticketId, server);
      }
      panelApi?.onChanged?.();
      if (message) toast.success(message);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Update failed");
      refreshTicket(ticketId);
    }
  };

  const handleDeleteTicket = async () => {
    if (!isAdmin) {
      toast.error("Only admins can delete tickets");
      return;
    }
    setBusy(true);
    try {
      if (panelApi?.remove) await panelApi.remove(ticketId);
      else await ticketService.deleteTicket(ticketId);
      panelApi?.onChanged?.();
      toast.success("Ticket deleted — trail kept in the Audit Log");
      closeTicket();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const handleAddComment = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    try {
      await ticketService.createTicketComment({ ticket_id: ticketId, content, user_id: user?.id });
      setCommentDraft("");
      await loadSideData(ticketId);
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleAddNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    try {
      await ticketService.createTicketNote({ ticket_id: ticketId, content, user_id: user?.id });
      setNoteDraft("");
      setAddingNote(false);
      await loadSideData(ticketId);
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await ticketService.uploadAttachment(ticketId, file, user?.id);
      }
      await loadSideData(ticketId);
      toast.success(files.length > 1 ? `${files.length} attachments added` : "Attachment added");
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("Failed to upload attachment");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleShare = async () => {
    const key = local.ticket_id || ticketId;
    const url = `${window.location.origin}/tickets?ticket=${encodeURIComponent(key)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.info("Deep link copied — opens this ticket after login");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const priorityName: string = local.ticket_priorities?.name || "";
  const categoryName: string = local.ticket_categories?.name || "";
  const assigneeName: string = local.assignee?.name || "";
  const creatorName: string = local.users?.name || "";

  const flag = (
    label: string,
    field: keyof Ticket,
    tone: "red" | "orange" | "green" | "blue",
    on: boolean,
  ) => (
    <Chip
      key={label}
      tone={on ? tone : "soft"}
      title={`Toggle: ${label}`}
      onClick={() =>
        applyUpdate({ [field]: !on } as Partial<Ticket>, { [field]: !on }, `${label}: ${!on ? "yes" : "no"}`)
      }
    >
      {on && <MIcon name="check" size={12} />}
      {label}
    </Chip>
  );

  const names = (list: Array<{ name: string }>) => list.map((item) => item.name);

  const panel = (
    <aside className={"detail-panel" + (expanded ? " dp-expanded" : "")}>
      <div className="dp-head">
        <span className="tk-num">{local.ticket_id || ticketId.slice(0, 8)}</span>
        <span className="dp-head-actions">
          <Btn small icon="ios_share" onClick={handleShare}>
            Share
          </Btn>
          <IconBtn
            icon={expanded ? "close_fullscreen" : "open_in_full"}
            size={16}
            title={expanded ? "Collapse to side panel" : "Expand to full view"}
            onClick={() => setExpanded((value) => !value)}
          />
          {isAdmin && (
            <IconBtn icon="delete" title="Delete ticket (admin)" onClick={() => setConfirmDelete(true)} />
          )}
          <IconBtn icon="right_panel_close" size={17} title="Close panel" onClick={closeTicket} />
        </span>
      </div>

      <div className="dp-body">
        <EditableText
          className="dp-title"
          value={local.title}
          placeholder="Add a title…"
          onSave={(value) => applyUpdate({ title: value.trim() }, { title: value.trim() }, "Title updated")}
        />
        <EditableText
          textarea
          className="dp-desc"
          value={local.description}
          placeholder="Add a description…"
          onSave={(value) =>
            applyUpdate({ description: value.trim() }, { description: value.trim() }, "Description updated")
          }
        />

        <div className="dp-section">Properties</div>
        <PropRow label="Status">
          <InlineSelect
            value={(local.status || "OPEN").toUpperCase()}
            options={[...STATUS_ORDER]}
            render={(value) => <StatusBadge status={value} />}
            onChange={(value) => {
              const previous = statusUi(local.status).label;
              applyUpdate({ status: value }, { status: value }, `Status ${previous} → ${statusUi(value).label}`);
            }}
          />
        </PropRow>
        <PropRow label="Urgency">
          <InlineSelect
            value={priorityName}
            options={options ? names(options.priorities) : []}
            render={(value) => <PriorityCell priority={value} />}
            onChange={(value) => {
              const priority = options?.priorities.find((item) => item.name === value);
              if (!priority) return;
              applyUpdate(
                { priority_id: priority.id },
                { ticket_priorities: { id: priority.id, name: priority.name } },
                "Priority set to " + value,
              );
            }}
          />
        </PropRow>
        <PropRow label="Category">
          <InlineSelect
            value={categoryName}
            options={options ? names(options.categories) : []}
            onChange={(value) => {
              const category = options?.categories.find((item) => item.name === value);
              if (!category) return;
              applyUpdate(
                { category_id: category.id },
                { ticket_categories: { id: category.id, name: category.name } },
                "Category updated",
              );
            }}
          />
        </PropRow>
        <PropRow label="Assigned to">
          <InlineSelect
            value={assigneeName}
            placeholder="Unassigned"
            options={options ? names(options.assignees) : []}
            render={(value) => (
              <span className="prop-person">
                <Avatar name={value} size={20} /> {value.split(" ")[0]}
              </span>
            )}
            onChange={(value) => {
              const assignee = options?.assignees.find((item) => item.name === value);
              if (!assignee) return;
              applyUpdate(
                { assignee_id: assignee.id },
                { assignee: { id: assignee.id, name: assignee.name } },
                "Assigned to " + value,
              );
            }}
          />
        </PropRow>
        <PropRow label="Site" icon="location_on">
          <InlineSelect
            value={local.siteId || local.site || ""}
            options={options ? names(options.sites) : []}
            onChange={(value) => applyUpdate({ siteId: value }, { siteId: value }, "Site updated")}
          />
        </PropRow>
        <PropRow label="Link" icon="cable">
          <InlineSelect
            value={local.linkName || ""}
            options={options ? names(options.links) : []}
            onChange={(value) => applyUpdate({ linkName: value }, { linkName: value }, "Link updated")}
          />
        </PropRow>
        <PropRow label="Service type" icon="lan">
          <InlineSelect
            value={local.serviceType || ""}
            options={options ? names(options.serviceTypes) : []}
            onChange={(value) => applyUpdate({ serviceType: value }, { serviceType: value }, "Service type updated")}
          />
        </PropRow>
        <PropRow label="Detection" icon="radar">
          <InlineSelect
            value={local.detectionSource || ""}
            options={options ? names(options.detectionSources) : []}
            onChange={(value) =>
              applyUpdate({ detectionSource: value }, { detectionSource: value }, "Detection source updated")
            }
          />
        </PropRow>
        <PropRow label="Traffic impact" icon="traffic">
          <InlineSelect
            value={local.trafficImpact || ""}
            options={options ? names(options.trafficImpacts) : []}
            onChange={(value) =>
              applyUpdate({ trafficImpact: value }, { trafficImpact: value }, "Traffic impact updated")
            }
          />
        </PropRow>
        <PropRow label="Demarcation" icon="border_vertical">
          <InlineSelect
            value={local.demarcation || ""}
            options={options ? names(options.demarcations) : []}
            onChange={(value) => applyUpdate({ demarcation: value }, { demarcation: value }, "Demarcation updated")}
          />
        </PropRow>
        <PropRow label="Created by" icon="person">
          {creatorName ? (
            <span className="prop-person">
              <Avatar name={creatorName} size={20} /> {creatorName}
            </span>
          ) : (
            <span className="dim">—</span>
          )}
        </PropRow>
        <PropRow label="Created" icon="schedule">
          {fmtDT(local.created_at)}
        </PropRow>

        <div className="dp-section">Incident timeline</div>
        <PropRow label="Incident date" icon="event">
          <EditableDateTime
            value={local.incidentDate}
            onSave={(value) => applyUpdate({ incidentDate: value }, { incidentDate: value }, "Incident date updated")}
          />
        </PropRow>
        <PropRow label="Detected" icon="notifications_active">
          <EditableDateTime
            value={local.detectionTime}
            onSave={(value) => applyUpdate({ detectionTime: value }, { detectionTime: value }, "Detection time updated")}
          />
        </PropRow>
        <PropRow label="Provider notified" icon="outgoing_mail">
          <EditableDateTime
            value={local.providerNotifiedTime}
            onSave={(value) =>
              applyUpdate({ providerNotifiedTime: value }, { providerNotifiedTime: value }, "Provider notified time updated")
            }
          />
        </PropRow>
        <PropRow label="Escalated" icon="trending_up">
          <EditableDateTime
            value={local.escalationTime}
            onSave={(value) =>
              applyUpdate({ escalationTime: value }, { escalationTime: value }, "Escalation time updated")
            }
          />
        </PropRow>
        <PropRow label="Restoration" icon="event_available">
          <EditableDateTime
            value={local.restorationTimeConfirmed}
            onSave={(value) =>
              applyUpdate(
                { restorationTimeConfirmed: value },
                { restorationTimeConfirmed: value },
                "Restoration time updated",
              )
            }
          />
        </PropRow>
        <PropRow label="Issue started" icon="play_circle">
          <InlineSelect
            value={local.issueStart ? "Yes" : "No"}
            options={["Yes", "No"]}
            onChange={(value) =>
              applyUpdate({ issueStart: value === "Yes" }, { issueStart: value === "Yes" }, "Issue start updated")
            }
          />
        </PropRow>
        <PropRow label="Issue cleared" icon="check_circle">
          <InlineSelect
            value={local.issueCleared ? "Yes" : "No"}
            options={["Yes", "No"]}
            onChange={(value) =>
              applyUpdate({ issueCleared: value === "Yes" }, { issueCleared: value === "Yes" }, "Issue cleared updated")
            }
          />
        </PropRow>
        <PropRow label="Gross downtime" icon="timer">
          <EditableText
            value={local.grossDowntimeMin != null && local.grossDowntimeMin !== "" ? String(local.grossDowntimeMin) + " min" : ""}
            placeholder="—"
            onSave={(value) => {
              const minutes = parseInt(value.replace(/[^\d]/g, ""), 10);
              const next = Number.isNaN(minutes) ? null : minutes;
              applyUpdate(
                { grossDowntimeMin: next } as Partial<Ticket>,
                { grossDowntimeMin: next },
                "Gross downtime updated",
              );
            }}
          />
        </PropRow>
        <PropRow label="Provider downtime" icon="timer_off">
          <EditableText
            value={
              local.providerDowntimeMin != null && local.providerDowntimeMin !== ""
                ? String(local.providerDowntimeMin) + " min"
                : ""
            }
            placeholder="—"
            onSave={(value) => {
              const minutes = parseInt(value.replace(/[^\d]/g, ""), 10);
              const next = Number.isNaN(minutes) ? null : minutes;
              applyUpdate(
                { providerDowntimeMin: next } as Partial<Ticket>,
                { providerDowntimeMin: next },
                "Provider downtime updated",
              );
            }}
          />
        </PropRow>

        <div className="dp-section">Flags</div>
        <div className="chip-row" style={{ padding: 0 }}>
          {flag("SLA impacted", "slaImpacted", "red", Boolean(local.slaImpacted))}
          {flag("Partner impacted", "partnerImpacted", "orange", Boolean(local.partnerImpacted))}
          {flag("Redundancy available", "redundancyAvailable", "green", Boolean(local.redundancyAvailable))}
          {flag("RFO received", "rfoReceived", "blue", Boolean(local.rfoReceived))}
        </div>

        <div className="dp-section">Root cause</div>
        <div className="rc-block">
          <div className="rc-l">Level 1</div>
          <EditableText
            value={local.rootCauseLev1}
            placeholder="Add root cause…"
            onSave={(value) =>
              applyUpdate({ rootCauseLev1: value.trim() }, { rootCauseLev1: value.trim() }, "Root cause updated")
            }
          />
          <div className="rc-l">Level 2</div>
          <EditableText
            value={local.rootCauseLev2}
            placeholder="Add detail…"
            onSave={(value) =>
              applyUpdate({ rootCauseLev2: value.trim() }, { rootCauseLev2: value.trim() }, "Root cause updated")
            }
          />
          <div className="rc-l">Preventive action</div>
          <EditableText
            textarea
            value={local.preventiveAction}
            placeholder="Add preventive action…"
            onSave={(value) =>
              applyUpdate(
                { preventiveAction: value.trim() },
                { preventiveAction: value.trim() },
                "Preventive action updated",
              )
            }
          />
        </div>

        <div className="dp-section">Attachments</div>
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attach-row">
            <span className="attach-ic">
              <MIcon name={/\.(png|jpe?g|gif|webp)$/i.test(attachment.filename) ? "image" : "picture_as_pdf"} size={17} />
            </span>
            <span className="attach-meta">
              <a className="attach-name" href={attachment.url} target="_blank" rel="noreferrer">
                {attachment.filename}
              </a>
              <span className="dim">{fmtDate(attachment.created_at)}</span>
            </span>
            <IconBtn icon="close" size={15} title="Remove attachment" onClick={() => setConfirmAttachment(attachment)} />
          </div>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(event) => handleUpload(event.target.files)}
        />
        <button type="button" className="link-btn" disabled={busy} onClick={() => fileInputRef.current?.click()}>
          <MIcon name="attach_file" size={14} /> Add attachment
        </button>

        <div className="dp-section">Discussion</div>
        <div className="dp-comments">
          {comments.map((comment) => {
            const author = firstOf(comment.users);
            const canDelete = comment.user_id === user?.id || isAdmin;
            return (
              <div key={comment.id} className="comment">
                <Avatar name={author?.name || "Unknown"} size={24} />
                <div className="comment-body">
                  <div className="comment-head">
                    <span className="comment-name">{author?.name || "Unknown"}</span>
                    <span className="dim">{timeAgo(comment.created_at)}</span>
                    {canDelete && (
                      <IconBtn
                        icon="delete"
                        size={13}
                        className="comment-x"
                        title="Delete comment"
                        onClick={() => setConfirmComment(comment.id)}
                      />
                    )}
                  </div>
                  <div className="comment-text">{comment.content}</div>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <div className="dim" style={{ fontSize: 12.5 }}>
              No comments yet.
            </div>
          )}
        </div>

        <div className="dp-section">Internal notes</div>
        {notes.map((note) => (
          <div key={note.id} className="note-row" style={{ marginBottom: 6 }}>
            <MIcon name="sticky_note_2" size={15} className="dim" />
            <span style={{ flex: 1 }}>{note.content}</span>
            {(note.user_id === user?.id || isAdmin) && (
              <IconBtn
                icon="delete"
                size={13}
                className="note-x"
                title="Delete note"
                onClick={() => setConfirmNote(note.id)}
              />
            )}
          </div>
        ))}
        {addingNote ? (
          <div style={{ display: "flex", gap: 7 }}>
            <input
              className="input"
              placeholder="Write an internal note…"
              value={noteDraft}
              autoFocus
              onChange={(event) => setNoteDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAddNote();
                if (event.key === "Escape") setAddingNote(false);
              }}
            />
            <Btn kind="primary" small icon="send" disabled={!noteDraft.trim()} onClick={handleAddNote} />
          </div>
        ) : (
          <button type="button" className="link-btn" onClick={() => setAddingNote(true)}>
            <MIcon name="add" size={14} /> Add note
          </button>
        )}
      </div>

      <div className="dp-foot">
        <input
          className="input"
          placeholder="Write a comment…"
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && commentDraft.trim()) handleAddComment();
          }}
        />
        <Btn kind="primary" small icon="send" disabled={!commentDraft.trim()} onClick={handleAddComment} />
      </div>

      <ConfirmDialog
        open={confirmComment != null}
        onClose={() => setConfirmComment(null)}
        title="Delete comment?"
        body="This removes the comment from the ticket record."
        onConfirm={async () => {
          if (confirmComment == null) return;
          try {
            await ticketService.deleteTicketComment(confirmComment);
            await loadSideData(ticketId);
            toast.success("Comment deleted");
          } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Failed to delete comment");
          } finally {
            setConfirmComment(null);
          }
        }}
      />
      <ConfirmDialog
        open={confirmNote != null}
        onClose={() => setConfirmNote(null)}
        title="Delete note?"
        body="This removes the internal note from the ticket record."
        onConfirm={async () => {
          if (confirmNote == null) return;
          try {
            await ticketService.deleteTicketNote(confirmNote);
            await loadSideData(ticketId);
            toast.success("Note deleted");
          } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note");
          } finally {
            setConfirmNote(null);
          }
        }}
      />
      <ConfirmDialog
        open={confirmAttachment != null}
        onClose={() => setConfirmAttachment(null)}
        title={`Delete “${confirmAttachment?.filename ?? ""}”?`}
        body="The file is removed from storage as well."
        onConfirm={async () => {
          if (!confirmAttachment) return;
          try {
            await ticketService.deleteAttachmentWithFile(confirmAttachment.id, confirmAttachment.url);
            await loadSideData(ticketId);
            toast.success("Attachment removed");
          } catch (error) {
            console.error("Error deleting attachment:", error);
            toast.error("Failed to delete attachment");
          } finally {
            setConfirmAttachment(null);
          }
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete ticket?"
        body="Ticket deletion is admin-only and enforced in the database. The audit log keeps the trail."
        busy={busy}
        onConfirm={handleDeleteTicket}
      />
    </aside>
  );

  // Expanded = the same panel promoted into a centered modal over a dimmed veil.
  // Clicking the veil (but not the panel) collapses back to the side panel.
  return expanded ? (
    <div
      className="dp-veil"
      onMouseDown={(event) => event.target === event.currentTarget && setExpanded(false)}
    >
      {panel}
    </div>
  ) : (
    panel
  );
}
