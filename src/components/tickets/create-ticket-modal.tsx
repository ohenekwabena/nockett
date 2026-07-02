"use client";

/**
 * New-ticket modal (design ticket-detail.jsx CreateTicketModal). Assembles a
 * NewTicketDraft and hands it to the intake seam (lib/ticket-intake), which
 * owns validation and the create → note → attachments sequence.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loadReferenceOptions, submitTicket, type ReferenceOptions } from "@/lib/ticket-intake";
import { useAuth } from "@/context/auth-context";
import { Btn, Field, MIcon, Modal, Select, STATUS_ORDER, statusUi } from "@/components/nk/ui";

interface Draft {
  title: string;
  description: string;
  note: string;
  status: string;
  category: string;
  priority: string;
  assignee: string;
  site: string;
  link: string;
  serviceType: string;
  detection: string;
  impact: string;
  demarcation: string;
}

const BLANK: Draft = {
  title: "",
  description: "",
  note: "",
  status: "OPEN",
  category: "",
  priority: "",
  assignee: "",
  site: "",
  link: "",
  serviceType: "",
  detection: "",
  impact: "",
  demarcation: "",
};

export function CreateTicketModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [options, setOptions] = useState<ReferenceOptions | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(BLANK);
    setFiles([]);
    loadReferenceOptions()
      .then((loaded) => {
        setOptions(loaded);
        setDraft((previous) => ({
          ...previous,
          priority:
            loaded.priorities.find((priority) => priority.name.toLowerCase() === "medium")?.name ||
            loaded.priorities[0]?.name ||
            "",
        }));
      })
      .catch((error) => {
        console.error("Error loading reference options:", error);
        toast.error("Failed to load ticket form options");
      });
  }, [open]);

  const set = (key: keyof Draft) => (value: string) => setDraft((previous) => ({ ...previous, [key]: value }));

  const names = useMemo(
    () => ({
      categories: options?.categories.map((item) => item.name) ?? [],
      priorities: options?.priorities.map((item) => item.name) ?? [],
      assignees: options?.assignees.map((item) => item.name) ?? [],
      sites: options?.sites.map((item) => item.name) ?? [],
      links: options?.links.map((item) => item.name) ?? [],
      serviceTypes: options?.serviceTypes.map((item) => item.name) ?? [],
      detectionSources: options?.detectionSources.map((item) => item.name) ?? [],
      trafficImpacts: options?.trafficImpacts.map((item) => item.name) ?? [],
      demarcations: options?.demarcations.map((item) => item.name) ?? [],
    }),
    [options],
  );

  const handleSubmit = async () => {
    if (!draft.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const category = options?.categories.find((item) => item.name === draft.category);
      const priority = options?.priorities.find((item) => item.name === draft.priority);
      const assignee = options?.assignees.find((item) => item.name === draft.assignee);

      const result = await submitTicket({
        fields: {
          title: draft.title.trim(),
          description: draft.description.trim(),
          status: draft.status,
          category_id: category?.id,
          priority_id: priority?.id,
          assignee_id: assignee?.id,
          creator_id: user?.id,
          siteId: draft.site || undefined,
          linkName: draft.link || undefined,
          serviceType: draft.serviceType || undefined,
          detectionSource: draft.detection || undefined,
          trafficImpact: draft.impact || undefined,
          demarcation: draft.demarcation || undefined,
        },
        initialNote: draft.note,
        attachments: files,
        actorId: user?.id,
      });

      toast.success(`${result.ticket.ticket_id || "Ticket"} created`);
      result.warnings.forEach((warning) => toast.warning(warning));

      onCreated();
      // Land on the queue with the new ticket's panel open (deep-link route).
      const key = result.ticket.ticket_id || result.ticket.id;
      router.push(`/tickets?ticket=${encodeURIComponent(key)}`);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    setFiles((previous) => [...previous, ...Array.from(incoming)]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New ticket"
      subtitle="A Ticket Number is assigned automatically on create."
      width={640}
      footer={
        <div className="row-end">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="add" disabled={!draft.title.trim() || submitting} onClick={handleSubmit}>
            {submitting ? "Creating…" : "Create ticket"}
          </Btn>
        </div>
      }
    >
      <div className="form-grid">
        <Field label="Title *" span>
          <input
            className="input"
            autoFocus
            placeholder="e.g. Fiber cut on ACC–KMS backbone"
            value={draft.title}
            onChange={(event) => set("title")(event.target.value)}
          />
        </Field>
        <Field label="Description" span>
          <textarea
            className="input"
            rows={3}
            placeholder="What happened, where, and what is affected…"
            value={draft.description}
            onChange={(event) => set("description")(event.target.value)}
          />
        </Field>
        <Field label="Category">
          <Select value={draft.category} onChange={set("category")} options={names.categories} placeholder="Select…" />
        </Field>
        <Field label="Priority">
          <Select value={draft.priority} onChange={set("priority")} options={names.priorities} placeholder="Select…" />
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={set("status")}
            options={STATUS_ORDER.map((status) => ({ value: status, label: statusUi(status).label }))}
          />
        </Field>
        <Field label="Assignee">
          <Select value={draft.assignee} onChange={set("assignee")} options={names.assignees} placeholder="Unassigned" />
        </Field>
        <Field label="Site">
          <Select value={draft.site} onChange={set("site")} options={names.sites} placeholder="Select…" />
        </Field>
        <Field label="Link">
          <Select value={draft.link} onChange={set("link")} options={names.links} placeholder="Select…" />
        </Field>
        <Field label="Service type">
          <Select value={draft.serviceType} onChange={set("serviceType")} options={names.serviceTypes} placeholder="Select…" />
        </Field>
        <Field label="Detection source">
          <Select value={draft.detection} onChange={set("detection")} options={names.detectionSources} placeholder="Select…" />
        </Field>
        <Field label="Traffic impact">
          <Select value={draft.impact} onChange={set("impact")} options={names.trafficImpacts} placeholder="Select…" />
        </Field>
        <Field label="Demarcation">
          <Select value={draft.demarcation} onChange={set("demarcation")} options={names.demarcations} placeholder="Select…" />
        </Field>
        <Field label="Initial note" span>
          <input
            className="input"
            placeholder="Optional working note attached on create"
            value={draft.note}
            onChange={(event) => set("note")(event.target.value)}
          />
        </Field>
        <div
          className={"dropzone" + (dragOver ? " over" : "")}
          style={{ gridColumn: "1 / -1" }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.onchange = () => addFiles(input.files);
            input.click();
          }}
        >
          <MIcon name="attach_file" size={17} />
          {files.length > 0
            ? files.map((file) => file.name).join(", ")
            : "Drag & drop attachments, or click to add (max 10 MB each)"}
        </div>
      </div>
    </Modal>
  );
}
