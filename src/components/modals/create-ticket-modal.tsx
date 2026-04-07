"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import React, { useState, useEffect, useRef } from "react";
import { capitalizeString } from "@/utils/functions";
import {
  ticketService,
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
import {
  PRIORITY_ICONS,
  STATUS_ICONS,
  CATEGORY_ICONS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  CATEGORY_COLORS,
  STATUSES,
} from "@/utils/constants";
import useSupabase from "@/hooks/use-supabase";

interface CreateTicketModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated: () => void;
  mode?: "create" | "edit";
  ticket?: {
    id?: string;
    title: string;
    description: string;
    category?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
    assignee?: {
      id: string | undefined;
      name: string | undefined;
      avatarUrl?: string;
    };
    initialNote?: string;
  };
}

export default function CreateTicketModal({
  isOpen,
  onOpenChange,
  onTicketCreated,
  mode = "create",
  ticket,
}: CreateTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [priority, setPriority] = useState("LOW");
  const [category, setCategory] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialNote, setInitialNote] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New ticket fields
  const [incidentDate, setIncidentDate] = useState("");
  const [issueStart, setIssueStart] = useState("No");
  const [detectionTime, setDetectionTime] = useState("");
  const [escalationTime, setEscalationTime] = useState("");
  const [providerNotifiedTime, setProviderNotifiedTime] = useState("");
  const [issueCleared, setIssueCleared] = useState("No");
  const [restorationTimeConfirmed, setRestorationTimeConfirmed] = useState("");
  const [grossDowntimeMin, setGrossDowntimeMin] = useState("");
  const [providerDowntimeMin, setProviderDowntimeMin] = useState("");
  const [rootCauseLev1, setRootCauseLev1] = useState("");
  const [rootCauseLev2, setRootCauseLev2] = useState("");
  const [slaImpacted, setSlaImpacted] = useState("No");
  const [redundancyAvailable, setRedundancyAvailable] = useState("No");
  const [partnerImpacted, setPartnerImpacted] = useState("No");
  const [rfoReceived, setRfoReceived] = useState("No");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [demarcation, setDemarcation] = useState("");
  const [linkName, setLinkName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [detectionSource, setDetectionSource] = useState("");
  const [trafficImpact, setTrafficImpact] = useState("");

  // Data for dropdowns
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [demarcations, setDemarcations] = useState<Demarcation[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [detectionSources, setDetectionSources] = useState<DetectionSource[]>([]);
  const [trafficImpacts, setTrafficImpacts] = useState<TrafficImpact[]>([]);
  const { user } = useSupabase();

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  // New useEffect to handle ticket data population for edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && ticket) {
      setTitle(ticket.title || "");
      setDescription(ticket.description || "");
      setStatus(ticket.status || "OPEN");
      setPriority(ticket.priority || "LOW");
      setCategory(ticket.category || "");
      setAssigneeId(ticket.assignee?.id || "");
      setInitialNote(ticket.initialNote || "");
      setError(null);
    } else if (isOpen && mode === "create") {
      // Reset form for create mode
      setTitle("");
      setDescription("");
      setStatus("OPEN");
      setPriority("LOW");
      setCategory("");
      setAssigneeId("");
      setInitialNote("");
      setIncidentDate("");
      setIssueStart("No");
      setDetectionTime("");
      setEscalationTime("");
      setProviderNotifiedTime("");
      setIssueCleared("No");
      setRestorationTimeConfirmed("");
      setGrossDowntimeMin("");
      setProviderDowntimeMin("");
      setRootCauseLev1("");
      setRootCauseLev2("");
      setSlaImpacted("No");
      setRedundancyAvailable("No");
      setPartnerImpacted("No");
      setRfoReceived("No");
      setPreventiveAction("");
      setDemarcation("");
      setLinkName("");
      setSiteId("");
      setServiceType("");
      setDetectionSource("");
      setTrafficImpact("");
      setPendingFiles([]);
      setError(null);
    }
  }, [isOpen, mode, ticket]);

  const loadDropdownData = async () => {
    try {
      const [
        categoriesRes,
        prioritiesRes,
        assigneesRes,
        demarcationsRes,
        linksRes,
        sitesRes,
        serviceTypesRes,
        detectionSourcesRes,
        trafficImpactsRes,
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

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (prioritiesRes.data) setPriorities(prioritiesRes.data);
      if (assigneesRes.data) setAssignees(assigneesRes.data);
      if (demarcationsRes.data) setDemarcations(demarcationsRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (serviceTypesRes.data) setServiceTypes(serviceTypesRes.data);
      if (detectionSourcesRes.data) setDetectionSources(detectionSourcesRes.data);
      if (trafficImpactsRes.data) setTrafficImpacts(trafficImpactsRes.data);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (mode === "edit" && !ticket?.id) {
      setError("Ticket ID is required for editing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priorityObj = priorities.find((p) => p.name.toUpperCase() === priority);
      const categoryObj = categories.find((c) => c.name.toUpperCase() === category);

      const ticketData = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority_id: priorityObj?.id,
        category_id: categoryObj?.id,
        assignee_id: assigneeId && assigneeId !== "unassigned" ? parseInt(assigneeId) : undefined,
        creator_id: user?.id,
        incidentDate: incidentDate || undefined,
        issueStart: issueStart === "Yes",
        detectionTime: detectionTime || undefined,
        escalationTime: escalationTime || undefined,
        providerNotifiedTime: providerNotifiedTime || undefined,
        issueCleared: issueCleared === "Yes",
        restorationTimeConfirmed: restorationTimeConfirmed || undefined,
        grossDowntimeMin: grossDowntimeMin ? parseInt(grossDowntimeMin) : undefined,
        providerDowntimeMin: providerDowntimeMin ? parseInt(providerDowntimeMin) : undefined,
        rootCauseLev1: rootCauseLev1.trim() || undefined,
        rootCauseLev2: rootCauseLev2.trim() || undefined,
        slaImpacted: slaImpacted === "Yes",
        redundancyAvailable: redundancyAvailable === "Yes",
        partnerImpacted: partnerImpacted === "Yes",
        rfoReceived: rfoReceived === "Yes",
        preventiveAction: preventiveAction.trim() || undefined,
        demarcation: demarcation || undefined,
        linkName: linkName || undefined,
        siteId: siteId || undefined,
        serviceType: serviceType || undefined,
        detectionSource: detectionSource || undefined,
        trafficImpact: trafficImpact || undefined,
      };

      let result: Awaited<ReturnType<typeof ticketService.createTicket>>;
      if (mode === "create") {
        result = await ticketService.createTicket(ticketData);

        // If ticket was created successfully and there's an initial note, add it
        if (!result.error && result.data && initialNote.trim()) {
          await ticketService.createTicketNote({
            ticket_id: result.data.id,
            content: initialNote.trim(),
            user_id: user?.id,
          });
        }

        // Upload pending attachments
        if (!result.error && result.data && pendingFiles.length > 0) {
          await Promise.all(
            pendingFiles.map((file) => ticketService.uploadAttachment(result.data!.id, file, user?.id)),
          );
        }

        // Send ticket-created email notification
        if (!result.error && result.data) {
          try {
            await fetch("/api/email/ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: user?.email, // Change to assignee or other recipient as needed
                subject: `Ticket Created: ${result.data.title}`,
                type: "ticket-created",
                props: {
                  ...result.data,
                  creatorName: "User",
                },
              }),
            });
          } catch (e) {
            // Optionally handle email error
            console.error("Failed to send ticket created email", e);
          }
        }
      } else {
        result = await ticketService.updateTicket(ticket?.id || "", ticketData);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        onTicketCreated();
      }
    } catch (err) {
      setError(`An unexpected error occurred: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
  const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
  const CategoryIcon = category ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mt-4 px-4 sm:px-6">
          <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">
            {mode === "create" ? "Create New Ticket" : "Edit Ticket"}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 mb-4">
            {priority && (
              <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} size={20} />
                  <span>{capitalizeString(priority)}</span>
                  <span>Priority</span>
                </div>
              </div>
            )}
            {status && (
              <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} size={20} />
                  <span>{capitalizeString(status)}</span>
                </div>
              </div>
            )}
            {category && CategoryIcon && (
              <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <CategoryIcon color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} size={20} />
                  <span>{capitalizeString(category)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-4 sm:mx-6 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 flex flex-col lg:flex-row">
          <div className="px-4 sm:px-6 flex-1">
            <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Ticket Details</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter ticket title"
                  className="w-full dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 active:ring-0"
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter ticket description"
                  className="w-full h-24 sm:h-32 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none active:ring-0"
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                  Initial Note {mode === "create" ? "(Optional)" : ""}
                </label>
                <Textarea
                  value={initialNote}
                  onChange={(e) => setInitialNote(e.target.value)}
                  placeholder={
                    mode === "create" ? "Add an initial note..." : "This field is for reference only in edit mode"
                  }
                  className="w-full h-20 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none active:ring-0"
                  disabled={mode === "edit"}
                />
                {mode === "edit" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use the Notes tab in the ticket details to add new notes.
                  </p>
                )}
              </div>

              {mode === "create" && (
                <div>
                  <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                    Attachments (Optional)
                  </label>
                  <div
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = Array.from(e.dataTransfer.files);
                      setPendingFiles((prev) => [...prev, ...dropped]);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                          e.target.value = "";
                        }
                      }}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag files here to attach</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Images, PDF, Word, Excel, CSV, TXT</p>
                  </div>
                  {pendingFiles.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pendingFiles.map((file, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
                        >
                          <span className="truncate max-w-[200px] text-gray-800 dark:text-gray-200">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-700 ml-2 text-xs"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-6 space-y-4 w-full lg:min-w-[300px] lg:w-auto">
            <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Properties</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Priority</span>
                <Select value={priority} onValueChange={(value) => setPriority(value as "LOW" | "MEDIUM" | "HIGH")}>
                  <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 bg-gray-200 text-gray-800 dark:text-gray-200">
                    {priorities.map((p) => (
                      <SelectItem key={p.id} value={p.name.toUpperCase()}>
                        {capitalizeString(p.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Status</span>
                <Select value={status} onValueChange={(value) => setStatus(value as "OPEN" | "IN_PROGRESS" | "CLOSED")}>
                  <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                    {STATUSES.filter((s) => (mode === "create" ? s !== "CLOSED" : true)).map((s) => (
                      <SelectItem key={s} value={s}>
                        {capitalizeString(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Category</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name.toUpperCase()}>
                        {capitalizeString(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Assignee</span>
                <Select
                  value={assigneeId || "unassigned"}
                  onValueChange={(value) => setAssigneeId(value === "unassigned" ? "" : value)}
                >
                  <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Fields */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-3">Entity Fields</h4>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Demarcation
                  </span>
                  <Select value={demarcation} onValueChange={setDemarcation}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {demarcations.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Link
                  </span>
                  <Select value={linkName} onValueChange={setLinkName}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {links.map((l) => (
                        <SelectItem key={l.id} value={l.name}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Site
                  </span>
                  <Select value={siteId} onValueChange={setSiteId}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Service Type
                  </span>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {serviceTypes.map((st) => (
                        <SelectItem key={st.id} value={st.name}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Detection Source
                  </span>
                  <Select value={detectionSource} onValueChange={setDetectionSource}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {detectionSources.map((ds) => (
                        <SelectItem key={ds.id} value={ds.name}>
                          {ds.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Traffic Impact
                  </span>
                  <Select value={trafficImpact} onValueChange={setTrafficImpact}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      {trafficImpacts.map((ti) => (
                        <SelectItem key={ti.id} value={ti.name}>
                          {ti.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Incident Fields */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-3">Incident Fields</h4>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Incident Date
                  </span>
                  <Input
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Issue Start
                  </span>
                  <Select value={issueStart} onValueChange={setIssueStart}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Detection Time
                  </span>
                  <Input
                    type="datetime-local"
                    value={detectionTime}
                    onChange={(e) => setDetectionTime(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Escalation Time
                  </span>
                  <Input
                    type="datetime-local"
                    value={escalationTime}
                    onChange={(e) => setEscalationTime(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Provider Notified
                  </span>
                  <Input
                    type="datetime-local"
                    value={providerNotifiedTime}
                    onChange={(e) => setProviderNotifiedTime(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Issue Cleared
                  </span>
                  <Select value={issueCleared} onValueChange={setIssueCleared}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Restoration Time
                  </span>
                  <Input
                    type="datetime-local"
                    value={restorationTimeConfirmed}
                    onChange={(e) => setRestorationTimeConfirmed(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Gross Downtime (min)
                  </span>
                  <Input
                    type="time"
                    value={grossDowntimeMin}
                    onChange={(e) => setGrossDowntimeMin(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Provider Downtime (min)
                  </span>
                  <Input
                    type="time"
                    value={providerDowntimeMin}
                    onChange={(e) => setProviderDowntimeMin(e.target.value)}
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Root Cause Lev1
                  </span>
                  <Input
                    type="text"
                    value={rootCauseLev1}
                    onChange={(e) => setRootCauseLev1(e.target.value)}
                    placeholder="Enter root cause level 1"
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Root Cause Lev2
                  </span>
                  <Input
                    type="text"
                    value={rootCauseLev2}
                    onChange={(e) => setRootCauseLev2(e.target.value)}
                    placeholder="Enter root cause level 2"
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    SLA Impacted
                  </span>
                  <Select value={slaImpacted} onValueChange={setSlaImpacted}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Redundancy Available
                  </span>
                  <Select value={redundancyAvailable} onValueChange={setRedundancyAvailable}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Partner Impacted
                  </span>
                  <Select value={partnerImpacted} onValueChange={setPartnerImpacted}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    RFO Received
                  </span>
                  <Select value={rfoReceived} onValueChange={setRfoReceived}>
                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                    Preventive Action
                  </span>
                  <Input
                    type="text"
                    value={preventiveAction}
                    onChange={(e) => setPreventiveAction(e.target.value)}
                    placeholder="Enter preventive action"
                    className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !title.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : mode === "create" ? "Create Ticket" : "Save Changes"}
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  disabled={loading}
                  className="flex-1 dark:bg-gray-600 bg-gray-200 dark:text-gray-200 text-gray-800 hover:text-gray-800 active:text-gray-800 hover:dark:text-gray-200 border-0 hover:bg-gray-300 hover:dark:bg-gray-500"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
