import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import React, { useState, useEffect, useRef } from "react";
import { capitalizeString, formatDate } from "@/utils/functions";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  ticketService,
  type TicketCategory,
  type TicketPriority,
  type Assignee,
  type TicketComment,
  type TicketNote,
  type TicketAttachment,
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
import { IconlyEditSquare, IconlyDelete } from "../icons";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import useSupabase from "@/hooks/use-supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import PersonEntityAvatar from "../person-entity-avatar";

interface TicketModalProps {
  ticket: {
    id?: string;
    title: string;
    description: string;
    category?: string;
    priority?: "LOW" | "MEDIUM" | "MAJOR" | "HIGH" | "HIGHEST" | "CRITICAL" | "DEFAULT";
    status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
    createdAt?: Date;
    updatedAt?: Date;
    assignee?: {
      id: string | undefined;
      name: string | undefined;
      avatarUrl?: string;
    };
    creator?: {
      id: string | undefined;
      name: string | undefined;
      email?: string | undefined;
      avatarUrl?: string;
    };
    slaDueAt?: Date;
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
    demarcation?: string;
    linkName?: string;
    siteId?: string;
    serviceType?: string;
    detectionSource?: string;
    trafficImpact?: string;
  };
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onTicketUpdated: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
  deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

export default function TicketModal({
  ticket,
  isOpen,
  onOpenChange,
  onTicketUpdated,
  updateTicketWithOptimism,
  deleteTicketWithOptimism,
}: TicketModalProps) {
  const [status, setStatus] = useState(ticket.status || "OPEN");
  const [priority, setPriority] = useState(ticket.priority || "LOW");
  const [category, setCategory] = useState(ticket.category || "");
  const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id || "");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<TicketAttachment | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "notes" | "attachments">("details");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [editedDescription, setEditedDescription] = useState(ticket.description || "");
  const [isEditingRootCauseLev1, setIsEditingRootCauseLev1] = useState(false);
  const [editedRootCauseLev1, setEditedRootCauseLev1] = useState(ticket.rootCauseLev1 || "");
  const [isEditingRootCauseLev2, setIsEditingRootCauseLev2] = useState(false);
  const [editedRootCauseLev2, setEditedRootCauseLev2] = useState(ticket.rootCauseLev2 || "");
  const [isEditingPreventiveAction, setIsEditingPreventiveAction] = useState(false);
  const [editedPreventiveAction, setEditedPreventiveAction] = useState(ticket.preventiveAction || "");
  const currentTicket = ticket;

  // New ticket fields
  const [incidentDate, setIncidentDate] = useState(ticket.incidentDate || "");
  const [issueStart, setIssueStart] = useState(ticket.issueStart ? "Yes" : "No");
  const [detectionTime, setDetectionTime] = useState(ticket.detectionTime || "");
  const [escalationTime, setEscalationTime] = useState(ticket.escalationTime || "");
  const [providerNotifiedTime, setProviderNotifiedTime] = useState(ticket.providerNotifiedTime || "");
  const [issueCleared, setIssueCleared] = useState(ticket.issueCleared ? "Yes" : "No");
  const [restorationTimeConfirmed, setRestorationTimeConfirmed] = useState(ticket.restorationTimeConfirmed || "");
  const [grossDowntimeMin, setGrossDowntimeMin] = useState(ticket.grossDowntimeMin || "");
  const [providerDowntimeMin, setProviderDowntimeMin] = useState(ticket.providerDowntimeMin || "");
  const [rootCauseLev1, setRootCauseLev1] = useState(ticket.rootCauseLev1 || "");
  const [rootCauseLev2, setRootCauseLev2] = useState(ticket.rootCauseLev2 || "");
  const [slaImpacted, setSlaImpacted] = useState(ticket.slaImpacted ? "Yes" : "No");
  const [redundancyAvailable, setRedundancyAvailable] = useState(ticket.redundancyAvailable ? "Yes" : "No");
  const [partnerImpacted, setPartnerImpacted] = useState(ticket.partnerImpacted ? "Yes" : "No");
  const [rfoReceived, setRfoReceived] = useState(ticket.rfoReceived ? "Yes" : "No");
  const [preventiveAction, setPreventiveAction] = useState(ticket.preventiveAction || "");
  const [demarcation, setDemarcation] = useState(ticket.demarcation || "");
  const [linkName, setLinkName] = useState(ticket.linkName || "");
  const [siteId, setSiteId] = useState(ticket.siteId || "");
  const [serviceType, setServiceType] = useState(ticket.serviceType || "");
  const [detectionSource, setDetectionSource] = useState(ticket.detectionSource || "");
  const [trafficImpact, setTrafficImpact] = useState(ticket.trafficImpact || "");

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
  const { user, role } = useSupabase();
  const isAdmin = role?.toLowerCase() === "admin";

  // Refetch ticket from database to get latest values
  const refreshTicketData = async () => {
    if (!ticket.id) return;
    try {
      const { data, error } = await ticketService.getTicketById(ticket.id);
      if (data && !error) {
        const matchedPriority = priorities.find((p) => p.id === data.priority_id);
        const matchedCategory = categories.find((c) => c.id === data.category_id);
        const resolvedPriority = matchedPriority?.name?.toUpperCase() as
          | TicketModalProps["ticket"]["priority"]
          | undefined;

        // Update local state with fresh data from database
        setStatus(data.status || "OPEN");
        setPriority(resolvedPriority || ticket.priority || priority);
        setCategory(
          matchedCategory?.name?.toUpperCase() ||
            (data as { category?: string }).category ||
            ticket.category ||
            category,
        );
        setAssigneeId(data.assignee_id ? data.assignee_id.toString() : ticket.assignee?.id || assigneeId);
        setEditedTitle(data.title);
        setEditedDescription(data.description || "");
        setIncidentDate(data.incidentDate || "");
        setIssueStart(data.issueStart ? "Yes" : "No");
        setDetectionTime(data.detectionTime || "");
        setEscalationTime(data.escalationTime || "");
        setProviderNotifiedTime(data.providerNotifiedTime || "");
        setIssueCleared(data.issueCleared ? "Yes" : "No");
        setRestorationTimeConfirmed(data.restorationTimeConfirmed || "");
        setGrossDowntimeMin(data.grossDowntimeMin || "");
        setProviderDowntimeMin(data.providerDowntimeMin || "");
        setRootCauseLev1(data.rootCauseLev1 || "");
        setRootCauseLev2(data.rootCauseLev2 || "");
        setSlaImpacted(data.slaImpacted ? "Yes" : "No");
        setRedundancyAvailable(data.redundancyAvailable ? "Yes" : "No");
        setPartnerImpacted(data.partnerImpacted ? "Yes" : "No");
        setRfoReceived(data.rfoReceived ? "Yes" : "No");
        setPreventiveAction(data.preventiveAction || "");
        // Reset edited states for edit-mode fields
        setEditedRootCauseLev1(data.rootCauseLev1 || "");
        setEditedRootCauseLev2(data.rootCauseLev2 || "");
        setEditedPreventiveAction(data.preventiveAction || "");
        setDemarcation(data.demarcation || "");
        setLinkName(data.linkName || "");
        setSiteId(data.siteId || "");
        setServiceType(data.serviceType || "");
        setDetectionSource(data.detectionSource || "");
        setTrafficImpact(data.trafficImpact || "");
      }
    } catch (err) {
      console.error("Error refreshing ticket data:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      loadCommentsAndNotes();
      loadAttachments();
      refreshTicketData();
      // Reset other state
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ticket]);

  useEffect(() => {
    if (isOpen && ticket.id && (priorities.length > 0 || categories.length > 0 || assignees.length > 0)) {
      refreshTicketData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ticket.id, priorities, categories, assignees]);

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

  const loadCommentsAndNotes = async () => {
    if (!ticket.id) return;

    try {
      const [commentsRes, notesRes] = await Promise.all([
        ticketService.getTicketComments(ticket.id),
        ticketService.getTicketNotes(ticket.id),
      ]);

      if (commentsRes.data) setComments(commentsRes.data);
      if (notesRes.data) setNotes(notesRes.data);
    } catch (err) {
      console.error("Error loading comments and notes:", err);
    }
  };

  const loadAttachments = async () => {
    if (!ticket.id) return;
    try {
      const { data } = await ticketService.getTicketAttachments(ticket.id);
      if (data) setAttachments(data as TicketAttachment[]);
    } catch (err) {
      console.error("Error loading attachments:", err);
    }
  };

  const handleAddComment = async () => {
    if (!ticket.id || !newComment.trim()) return;

    setLoading(true);
    try {
      // Try to create comment with user_id first
      const result = await ticketService.createTicketComment({
        ticket_id: ticket.id,
        content: newComment.trim(),
        user_id: user?.id,
      });

      if (!result.error) {
        setNewComment("");
        await loadCommentsAndNotes();
      } else {
        console.error("Error adding comment:", result.error);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!ticket.id || !newNote.trim()) return;

    setLoading(true);
    try {
      // Try to create note with user_id first
      const result = await ticketService.createTicketNote({
        ticket_id: ticket.id,
        content: newNote.trim(),
        user_id: user?.id,
      });

      if (!result.error) {
        setNewNote("");
        await loadCommentsAndNotes();
      } else {
        console.error("Error adding note:", result.error);
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setLoading(true);
    try {
      const { error } = await ticketService.deleteTicketComment(commentId);
      if (!error) {
        await loadCommentsAndNotes();
        // Add 1000ms delay before closing dialog
        setTimeout(() => {
          setCommentToDelete(null);
        }, 1000);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true);
    try {
      const { error } = await ticketService.deleteTicketNote(noteId);
      if (!error) {
        await loadCommentsAndNotes();
        // Add 1000ms delay before closing dialog
        setTimeout(() => {
          setNoteToDelete(null);
        }, 1000);
      }
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQuickUpdate = async (field: string, value: any) => {
    if (!ticket.id) return;

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let optimisticUpdates: any = {};

      switch (field) {
        case "status":
          updateData.status = value;
          setStatus(value);
          optimisticUpdates = { status: value };
          break;
        case "priority":
          const priorityObj = priorities.find((p) => p.name.toUpperCase() === value);
          updateData.priority_id = priorityObj?.id;
          setPriority(value);
          optimisticUpdates = {
            ticket_priorities: [{ id: priorityObj?.id, name: priorityObj?.name }],
          };
          break;
        case "category":
          const categoryObj = categories.find((c) => c.name.toUpperCase() === value);
          updateData.category_id = categoryObj?.id;
          setCategory(value);
          optimisticUpdates = {
            ticket_categories: [{ id: categoryObj?.id, name: categoryObj?.name }],
          };
          break;
        case "assignee":
          updateData.assignee_id = value && value !== "unassigned" ? parseInt(value) : null;
          setAssigneeId(value === "unassigned" ? "" : value);
          const assigneeObj = assignees.find((a) => a.id.toString() === value);
          optimisticUpdates = {
            assignee: value === "unassigned" ? null : [{ id: parseInt(value), name: assigneeObj?.name }],
          };
          break;
        case "incidentDate":
          updateData.incidentDate = value;
          setIncidentDate(value);
          optimisticUpdates = { incidentDate: value };
          break;
        case "issueStart":
          updateData.issueStart = value === "Yes";
          setIssueStart(value);
          optimisticUpdates = { issueStart: value === "Yes" };
          break;
        case "detectionTime":
          updateData.detectionTime = value;
          setDetectionTime(value);
          optimisticUpdates = { detectionTime: value };
          break;
        case "escalationTime":
          updateData.escalationTime = value;
          setEscalationTime(value);
          optimisticUpdates = { escalationTime: value };
          break;
        case "providerNotifiedTime":
          updateData.providerNotifiedTime = value;
          setProviderNotifiedTime(value);
          optimisticUpdates = { providerNotifiedTime: value };
          break;
        case "issueCleared":
          updateData.issueCleared = value === "Yes";
          setIssueCleared(value);
          optimisticUpdates = { issueCleared: value === "Yes" };
          break;
        case "restorationTimeConfirmed":
          updateData.restorationTimeConfirmed = value;
          setRestorationTimeConfirmed(value);
          optimisticUpdates = { restorationTimeConfirmed: value };
          break;
        case "grossDowntimeMin":
          updateData.grossDowntimeMin = value ? parseInt(value) : null;
          setGrossDowntimeMin(value);
          optimisticUpdates = { grossDowntimeMin: value ? parseInt(value) : null };
          break;
        case "providerDowntimeMin":
          updateData.providerDowntimeMin = value ? parseInt(value) : null;
          setProviderDowntimeMin(value);
          optimisticUpdates = { providerDowntimeMin: value ? parseInt(value) : null };
          break;
        case "rootCauseLev1":
          updateData.rootCauseLev1 = value;
          setRootCauseLev1(value);
          optimisticUpdates = { rootCauseLev1: value };
          break;
        case "rootCauseLev2":
          updateData.rootCauseLev2 = value;
          setRootCauseLev2(value);
          optimisticUpdates = { rootCauseLev2: value };
          break;
        case "slaImpacted":
          updateData.slaImpacted = value === "Yes";
          setSlaImpacted(value);
          optimisticUpdates = { slaImpacted: value === "Yes" };
          break;
        case "redundancyAvailable":
          updateData.redundancyAvailable = value === "Yes";
          setRedundancyAvailable(value);
          optimisticUpdates = { redundancyAvailable: value === "Yes" };
          break;
        case "partnerImpacted":
          updateData.partnerImpacted = value === "Yes";
          setPartnerImpacted(value);
          optimisticUpdates = { partnerImpacted: value === "Yes" };
          break;
        case "rfoReceived":
          updateData.rfoReceived = value === "Yes";
          setRfoReceived(value);
          optimisticUpdates = { rfoReceived: value === "Yes" };
          break;
        case "preventiveAction":
          updateData.preventiveAction = value;
          setPreventiveAction(value);
          optimisticUpdates = { preventiveAction: value };
          break;
        case "demarcation":
          updateData.demarcation = value;
          setDemarcation(value);
          optimisticUpdates = { demarcation: value };
          break;
        case "linkName":
          updateData.linkName = value;
          setLinkName(value);
          optimisticUpdates = { linkName: value };
          break;
        case "siteId":
          updateData.siteId = value;
          setSiteId(value);
          optimisticUpdates = { siteId: value };
          break;
        case "serviceType":
          updateData.serviceType = value;
          setServiceType(value);
          optimisticUpdates = { serviceType: value };
          break;
        case "detectionSource":
          updateData.detectionSource = value;
          setDetectionSource(value);
          optimisticUpdates = { detectionSource: value };
          break;
        case "trafficImpact":
          updateData.trafficImpact = value;
          setTrafficImpact(value);
          optimisticUpdates = { trafficImpact: value };
          break;
      }

      let sendEmail = false;
      let emailType = "ticket-updated";
      switch (field) {
        case "status":
          updateData.status = value;
          setStatus(value);
          optimisticUpdates = { status: value };
          sendEmail = true;
          if (value === "CLOSED") {
            emailType = "ticket-closed";
          }
          break;
      }

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        // Fallback to regular update
        const { error, data } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update field");
          console.error("Error updating ticket:", error);
        } else if (sendEmail) {
          // Send ticket-updated or ticket-closed email notification
          try {
            await fetch("/api/email/ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: ticket.creator?.email, // Change to assignee or other recipient as needed
                subject:
                  emailType === "ticket-closed" ? `Ticket Closed: ${ticket.title}` : `Ticket Updated: ${ticket.title}`,
                type: emailType,
                props: {
                  ...ticket,
                  status: value,
                },
              }),
            });
          } catch (e) {
            // Optionally handle email error
            console.error("Failed to send ticket update/closed email", e);
          }
        }
      }
    } catch (err) {
      toast.error("Failed to update field");
      console.error("Error updating ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket.id) return;
    if (!isAdmin) {
      toast.error("Only admins can delete tickets");
      return;
    }

    setLoading(true);
    try {
      if (deleteTicketWithOptimism) {
        await deleteTicketWithOptimism(ticket.id);
      } else {
        // Fallback to regular delete
        const { error } = await ticketService.deleteTicket(ticket.id);
        if (!error) {
          onTicketUpdated();
        }
      }
      onOpenChange?.(false);
    } catch (err) {
      console.error("Error deleting ticket:", err);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!ticket.id || editedTitle.trim() === ticket.title) {
      setIsEditingTitle(false);
      setEditedTitle(ticket.title);
      return;
    }

    setLoading(true);
    try {
      const updateData = { title: editedTitle.trim() };
      const optimisticUpdates = { title: editedTitle.trim() };

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        const { error } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update title");
          console.error("Error updating title:", error);
          setEditedTitle(ticket.title); // Revert on error
        } else {
          toast.success("Title updated");
        }
      }
      setIsEditingTitle(false);
    } catch (err) {
      toast.error("Failed to update title");
      console.error("Error updating title:", err);
      setEditedTitle(ticket.title); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!ticket.id || editedDescription.trim() === (ticket.description || "")) {
      setIsEditingDescription(false);
      setEditedDescription(ticket.description || "");
      return;
    }

    setLoading(true);
    try {
      const updateData = { description: editedDescription.trim() };
      const optimisticUpdates = { description: editedDescription.trim() };

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        const { error } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update description");
          console.error("Error updating description:", error);
          setEditedDescription(ticket.description || ""); // Revert on error
        } else {
          toast.success("Description updated");
        }
      }
      setIsEditingDescription(false);
    } catch (err) {
      toast.error("Failed to update description");
      console.error("Error updating description:", err);
      setEditedDescription(ticket.description || ""); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTitleEdit = () => {
    setEditedTitle(ticket.title);
    setIsEditingTitle(false);
  };

  const handleCancelDescriptionEdit = () => {
    setEditedDescription(ticket.description || "");
    setIsEditingDescription(false);
  };

  const handleSaveRootCauseLev1 = async () => {
    if (!ticket.id || editedRootCauseLev1.trim() === (ticket.rootCauseLev1 || "")) {
      setIsEditingRootCauseLev1(false);
      setEditedRootCauseLev1(ticket.rootCauseLev1 || "");
      return;
    }

    setLoading(true);
    try {
      const updateData = { rootCauseLev1: editedRootCauseLev1.trim() };
      const optimisticUpdates = { rootCauseLev1: editedRootCauseLev1.trim() };

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        const { error } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update root cause level 1");
          setEditedRootCauseLev1(ticket.rootCauseLev1 || "");
          return;
        }
      }
      toast.success("Root Cause Level 1 updated");
      setIsEditingRootCauseLev1(false);
    } catch (err) {
      toast.error("Failed to update root cause level 1");
      setEditedRootCauseLev1(ticket.rootCauseLev1 || "");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRootCauseLev1Edit = () => {
    setEditedRootCauseLev1(ticket.rootCauseLev1 || "");
    setIsEditingRootCauseLev1(false);
  };

  const handleSaveRootCauseLev2 = async () => {
    if (!ticket.id || editedRootCauseLev2.trim() === (ticket.rootCauseLev2 || "")) {
      setIsEditingRootCauseLev2(false);
      setEditedRootCauseLev2(ticket.rootCauseLev2 || "");
      return;
    }

    setLoading(true);
    try {
      const updateData = { rootCauseLev2: editedRootCauseLev2.trim() };
      const optimisticUpdates = { rootCauseLev2: editedRootCauseLev2.trim() };

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        const { error } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update root cause level 2");
          setEditedRootCauseLev2(ticket.rootCauseLev2 || "");
          return;
        }
      }
      toast.success("Root Cause Level 2 updated");
      setIsEditingRootCauseLev2(false);
    } catch (err) {
      toast.error("Failed to update root cause level 2");
      setEditedRootCauseLev2(ticket.rootCauseLev2 || "");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRootCauseLev2Edit = () => {
    setEditedRootCauseLev2(ticket.rootCauseLev2 || "");
    setIsEditingRootCauseLev2(false);
  };

  const handleSavePreventiveAction = async () => {
    if (!ticket.id || editedPreventiveAction.trim() === (ticket.preventiveAction || "")) {
      setIsEditingPreventiveAction(false);
      setEditedPreventiveAction(ticket.preventiveAction || "");
      return;
    }

    setLoading(true);
    try {
      const updateData = { preventiveAction: editedPreventiveAction.trim() };
      const optimisticUpdates = { preventiveAction: editedPreventiveAction.trim() };

      if (updateTicketWithOptimism) {
        await updateTicketWithOptimism(ticket.id, optimisticUpdates, updateData);
      } else {
        const { error } = await ticketService.updateTicket(ticket.id, updateData);
        if (error) {
          toast.error("Failed to update preventive action");
          setEditedPreventiveAction(ticket.preventiveAction || "");
          return;
        }
      }
      toast.success("Preventive Action updated");
      setIsEditingPreventiveAction(false);
    } catch (err) {
      toast.error("Failed to update preventive action");
      setEditedPreventiveAction(ticket.preventiveAction || "");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreventiveActionEdit = () => {
    setEditedPreventiveAction(ticket.preventiveAction || "");
    setIsEditingPreventiveAction(false);
  };

  const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS] || PRIORITY_ICONS.DEFAULT;
  const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || STATUS_ICONS.DEFAULT;
  const CategoryIcon = category
    ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.DEFAULT
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] h-[90vh] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 flex flex-col">
        <DialogHeader className="mt-4 px-4 sm:px-6 flex-shrink-0">
          <div className="flex flex-col xs:flex-row items-center justify-between gap-2">
            <div className="flex-1 w-full">
              {isEditingTitle ? (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl sm:text-3xl font-semibold h-auto py-2 dark:bg-gray-700 bg-gray-100 border-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") handleCancelTitleEdit();
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveTitle}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelTitleEdit}
                      className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">
                    #{currentTicket.id?.slice(-8) || "N/A"} - {editedTitle || currentTicket.title}
                  </DialogTitle>
                  <Button
                    onClick={() => setIsEditingTitle(true)}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 h-auto"
                    disabled={loading}
                  >
                    <IconlyEditSquare color="currentColor" size={16} />
                  </Button>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 items-center justify-center">
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center sm:space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                  disabled={loading}
                >
                  <IconlyDelete color="white" size={16} />
                  <span className="hidden sm:inline-block">Delete</span>
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 mb-4">
            {priority && (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <PriorityIcon
                    color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.DEFAULT}
                    size={20}
                  />
                  <span>{capitalizeString(priority)}</span>
                  <span>Priority</span>
                </div>
              </div>
            )}
            {status && (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <StatusIcon
                    color={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DEFAULT}
                    size={20}
                  />
                  <span>{capitalizeString(status)}</span>
                </div>
              </div>
            )}
            {category && CategoryIcon && (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                <div className="flex items-center space-x-1">
                  <CategoryIcon
                    color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.DEFAULT}
                    size={20}
                  />
                  <span>{capitalizeString(category)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {isAdmin && showDeleteConfirm && (
          <div className="mx-4 sm:mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
            <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2">Confirm Delete</h4>
            <p className="text-red-700 dark:text-red-300 text-sm mb-3">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white  text-sm px-3 py-1"
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="text-sm text-white hover:bg-slate-800 px-3 py-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tabs Component */}
        <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "details" | "comments" | "notes" | "attachments")}
            className="flex flex-col h-full"
          >
            <div className="overflow-x-auto flex-shrink-0">
              <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 min-w-max pb-2">
                <TabsTrigger
                  value="details"
                  className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-900 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-900 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                >
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-900 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                >
                  Notes ({notes.length})
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-900 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                >
                  Attachments ({attachments.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="details" className="mt-4 space-y-4 focus-visible:outline-none">
                <div className="flex flex-col m-0 m:p-2 gap-6 lg:flex-row">
                  <div className="flex-1 p-3 sm:p-6 md:border md:border-gray-200 md:dark:border-gray-700 md:rounded-lg md:bg-gray-50 md:dark:bg-gray-900">
                    <div className="group mb-8">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Description</h3>
                        {!isEditingDescription && (
                          <Button
                            onClick={() => setIsEditingDescription(true)}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 h-auto"
                            disabled={loading}
                          >
                            <IconlyEditSquare color="currentColor" size={14} />
                          </Button>
                        )}
                      </div>
                      {isEditingDescription ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="w-full dark:bg-gray-700 bg-gray-100 border-0 min-h-[100px]"
                            placeholder="Enter description..."
                            onKeyDown={(e) => {
                              if (e.key === "Escape") handleCancelDescriptionEdit();
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveDescription}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelDescriptionEdit}
                              className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="w-full">
                          {editedDescription || currentTicket.description || "No description provided"}
                        </p>
                      )}
                    </div>

                    {/* Root Cause and Preventive Action Section */}
                    <div className="space-y-4 mb-8">
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Root Cause Level 1</h3>
                          {!isEditingRootCauseLev1 && (
                            <Button
                              onClick={() => setIsEditingRootCauseLev1(true)}
                              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 h-auto"
                              disabled={loading}
                            >
                              <IconlyEditSquare color="currentColor" size={14} />
                            </Button>
                          )}
                        </div>
                        {isEditingRootCauseLev1 ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedRootCauseLev1}
                              onChange={(e) => setEditedRootCauseLev1(e.target.value)}
                              className="w-full dark:bg-gray-700 bg-gray-100 border-0 min-h-[100px]"
                              placeholder="Enter root cause level 1..."
                              onKeyDown={(e) => {
                                if (e.key === "Escape") handleCancelRootCauseLev1Edit();
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveRootCauseLev1}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelRootCauseLev1Edit}
                                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="w-full">{editedRootCauseLev1 || "No root cause level 1 provided"}</p>
                        )}
                      </div>

                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Root Cause Level 2</h3>
                          {!isEditingRootCauseLev2 && (
                            <Button
                              onClick={() => setIsEditingRootCauseLev2(true)}
                              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 h-auto"
                              disabled={loading}
                            >
                              <IconlyEditSquare color="currentColor" size={14} />
                            </Button>
                          )}
                        </div>
                        {isEditingRootCauseLev2 ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedRootCauseLev2}
                              onChange={(e) => setEditedRootCauseLev2(e.target.value)}
                              className="w-full dark:bg-gray-700 bg-gray-100 border-0 min-h-[100px]"
                              placeholder="Enter root cause level 2..."
                              onKeyDown={(e) => {
                                if (e.key === "Escape") handleCancelRootCauseLev2Edit();
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveRootCauseLev2}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelRootCauseLev2Edit}
                                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="w-full">{editedRootCauseLev2 || "No root cause level 2 provided"}</p>
                        )}
                      </div>

                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Preventive Action</h3>
                          {!isEditingPreventiveAction && (
                            <Button
                              onClick={() => setIsEditingPreventiveAction(true)}
                              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 h-auto"
                              disabled={loading}
                            >
                              <IconlyEditSquare color="currentColor" size={14} />
                            </Button>
                          )}
                        </div>
                        {isEditingPreventiveAction ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedPreventiveAction}
                              onChange={(e) => setEditedPreventiveAction(e.target.value)}
                              className="w-full dark:bg-gray-700 bg-gray-100 border-0 min-h-[100px]"
                              placeholder="Enter preventive action..."
                              onKeyDown={(e) => {
                                if (e.key === "Escape") handleCancelPreventiveActionEdit();
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSavePreventiveAction}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelPreventiveActionEdit}
                                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="w-full">{editedPreventiveAction || "No preventive action provided"}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:mt-20 mb-3">
                      <div>
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Created By</h3>
                        <PersonEntityAvatar name={ticket.creator?.name} image={ticket.creator?.avatarUrl} type="user" />
                      </div>

                      <div>
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Assignee</h3>
                        <PersonEntityAvatar
                          name={ticket.assignee?.name}
                          image={ticket.assignee?.avatarUrl}
                          type="assignee"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pb-6 space-y-4 mt-6 sm:mt-0 w-full lg:w-auto">
                    <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Quick Actions</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Priority</span>
                        <Select
                          value={priority}
                          onValueChange={(value) => handleQuickUpdate("priority", value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
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
                        <Select
                          value={status}
                          onValueChange={(value) => handleQuickUpdate("status", value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {capitalizeString(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Category</span>
                        <Select
                          value={category}
                          onValueChange={(value) => handleQuickUpdate("category", value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
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
                          onValueChange={(value) => handleQuickUpdate("assignee", value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
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
                      <div className="border-t pt-4">
                        <h4 className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-3">Entity Fields</h4>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Demarcation
                          </span>
                          <Select
                            value={demarcation}
                            onValueChange={(v) => handleQuickUpdate("demarcation", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={linkName}
                            onValueChange={(v) => handleQuickUpdate("linkName", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={siteId}
                            onValueChange={(v) => handleQuickUpdate("siteId", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={serviceType}
                            onValueChange={(v) => handleQuickUpdate("serviceType", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={detectionSource}
                            onValueChange={(v) => handleQuickUpdate("detectionSource", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={trafficImpact}
                            onValueChange={(v) => handleQuickUpdate("trafficImpact", v)}
                            disabled={loading}
                          >
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
                      <div className="border-t pt-4">
                        <h4 className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-3">Incident Fields</h4>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Incident Date
                          </span>
                          <Input
                            type="datetime-local"
                            value={incidentDate}
                            onChange={(e) => handleQuickUpdate("incidentDate", e.target.value)}
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Issue Start
                          </span>
                          <Select
                            value={issueStart}
                            onValueChange={(v) => handleQuickUpdate("issueStart", v)}
                            disabled={loading}
                          >
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
                            onChange={(e) => handleQuickUpdate("detectionTime", e.target.value)}
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Escalation Time
                          </span>
                          <Input
                            type="datetime-local"
                            value={escalationTime}
                            onChange={(e) => handleQuickUpdate("escalationTime", e.target.value)}
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Provider Notified
                          </span>
                          <Input
                            type="datetime-local"
                            value={providerNotifiedTime}
                            onChange={(e) => handleQuickUpdate("providerNotifiedTime", e.target.value)}
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Issue Cleared
                          </span>
                          <Select
                            value={issueCleared}
                            onValueChange={(v) => handleQuickUpdate("issueCleared", v)}
                            disabled={loading}
                          >
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
                            onChange={(e) => handleQuickUpdate("restorationTimeConfirmed", e.target.value)}
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Gross Downtime (min)
                          </span>
                          <Input
                            type="text"
                            value={grossDowntimeMin}
                            onChange={(e) => handleQuickUpdate("grossDowntimeMin", e.target.value)}
                            placeholder="Enter minutes"
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            Provider Downtime (min)
                          </span>
                          <Input
                            type="text"
                            value={providerDowntimeMin}
                            onChange={(e) => handleQuickUpdate("providerDowntimeMin", e.target.value)}
                            placeholder="Enter minutes"
                            className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                          <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[140px] text-sm whitespace-nowrap">
                            SLA Impacted
                          </span>
                          <Select
                            value={slaImpacted}
                            onValueChange={(v) => handleQuickUpdate("slaImpacted", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={redundancyAvailable}
                            onValueChange={(v) => handleQuickUpdate("redundancyAvailable", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={partnerImpacted}
                            onValueChange={(v) => handleQuickUpdate("partnerImpacted", v)}
                            disabled={loading}
                          >
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
                          <Select
                            value={rfoReceived}
                            onValueChange={(v) => handleQuickUpdate("rfoReceived", v)}
                            disabled={loading}
                          >
                            <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-4 space-y-4 focus-visible:outline-none">
                <div className="flex flex-col  p-2 md:p-6 gap-2 mb-6 md:border md:border-gray-200 md:dark:border-gray-700 md:rounded-lg md:bg-gray-50 md:dark:bg-gray-900">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Add Comment</h3>
                  <div className="flex gap-2 mb-6">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={loading || !newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-fit"
                    >
                      {loading ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Comments</h3>
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</p>
                    ) : (
                      comments.map((comment) => {
                        const commentUser = Array.isArray(comment.users) ? comment.users[0] : comment.users;

                        return (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:justify-between justify-between items-start mb-2">
                              <PersonEntityAvatar
                                name={commentUser?.name}
                                type="user"
                                className="scale-75 origin-left"
                              />
                              <div className="flex justify-center items-center gap-2 mt-2 sm:mt-0">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {comment.created_at ? formatDate(comment.created_at) : ""}
                                </span>
                                {comment.user_id === user?.id && (
                                  <AlertDialog
                                    open={commentToDelete === comment.id}
                                    onOpenChange={(open) => !open && setCommentToDelete(null)}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <button
                                        onClick={() => setCommentToDelete(comment.id)}
                                        className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 dark:hover:text-red-300 cursor-pointer dark:text-red-500"
                                      >
                                        Delete
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                                          Delete Comment
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                          Are you sure you want to delete this comment? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel
                                          className="bg-gray-100 dark:bg-gray-700 text-gray-900 
                                                                                    hover:text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteComment(comment.id)}
                                          disabled={loading}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          {loading ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                            <p className="text-sm sm:ml-4 md:ml-6 lg:ml-10">{comment.content}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-4 focus-visible:outline-none">
                <div className="flex flex-col  p-2 md:p-6 gap-2 mb-6 md:border md:border-gray-200 md:dark:border-gray-700 md:rounded-lg md:bg-gray-50 md:dark:bg-gray-900">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Add Note</h3>
                  <div className="flex gap-2 mb-6">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={loading || !newNote.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white h-fit"
                    >
                      {loading ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Notes</h3>
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No notes yet.</p>
                    ) : (
                      notes.map((note) => {
                        const noteUser = Array.isArray(note.users) ? note.users[0] : note.users;

                        return (
                          <div key={note.id} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-2">
                              <PersonEntityAvatar name={noteUser?.name} type="user" className="scale-75 origin-left" />
                              <div className="flex gap-2 items-center justify-center mt-2 sm:mt-0">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {note.created_at ? formatDate(note.created_at) : ""}
                                </span>
                                {note.user_id === user?.id && (
                                  <AlertDialog
                                    open={noteToDelete === note.id}
                                    onOpenChange={(open) => !open && setNoteToDelete(null)}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <button
                                        onClick={() => setNoteToDelete(note.id)}
                                        className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 dark:hover:text-red-300 cursor-pointer dark:text-red-500"
                                      >
                                        Delete
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                                          Delete Note
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                          Are you sure you want to delete this note? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 hover:text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteNote(note.id)}
                                          disabled={loading}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          {loading ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                            <p className="text-sm sm:ml-4 md:ml-6 lg:ml-10">{note.content}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-4 space-y-4 focus-visible:outline-none">
                <div className="flex flex-col p-2 md:p-6 gap-4 md:border md:border-gray-200 md:dark:border-gray-700 md:rounded-lg md:bg-gray-50 md:dark:bg-gray-900">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Upload Attachment</h3>
                  <div
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    onClick={() => attachmentInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (!ticket.id) return;
                      const files = Array.from(e.dataTransfer.files);
                      setAttachmentLoading(true);
                      await Promise.all(files.map((f) => ticketService.uploadAttachment(ticket.id!, f, user?.id)));
                      await loadAttachments();
                      setAttachmentLoading(false);
                    }}
                  >
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      className="hidden"
                      onChange={async (e) => {
                        if (!ticket.id || !e.target.files) return;
                        const files = Array.from(e.target.files);
                        e.target.value = "";
                        setAttachmentLoading(true);
                        await Promise.all(files.map((f) => ticketService.uploadAttachment(ticket.id!, f, user?.id)));
                        await loadAttachments();
                        setAttachmentLoading(false);
                      }}
                    />
                    {attachmentLoading ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag files here to attach</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Images, PDF, Word, Excel, CSV, TXT
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Attachments</h3>
                  {attachments.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No attachments yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {attachments.map((att) => {
                        const publicUrl = ticketService.getAttachmentPublicUrl(att.url);
                        const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(att.filename);
                        return (
                          <div
                            key={att.id}
                            className="relative group rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900"
                          >
                            {isImage ? (
                              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={publicUrl} alt={att.filename} className="w-full h-28 object-cover" />
                              </a>
                            ) : (
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center h-28 gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-10 w-10"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v13a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <span className="text-xs text-center px-1 truncate w-full">{att.filename}</span>
                              </a>
                            )}
                            {isImage && (
                              <p className="text-xs text-center px-1 py-1 truncate text-gray-600 dark:text-gray-400">
                                {att.filename}
                              </p>
                            )}
                            {(isAdmin || att.uploaded_by === user?.id) && (
                              <AlertDialog
                                open={attachmentToDelete?.id === att.id}
                                onOpenChange={(open) => !open && setAttachmentToDelete(null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={() => setAttachmentToDelete(att)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete attachment"
                                  >
                                    ✕
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                                      Delete Attachment
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                      Are you sure you want to delete &quot;{att.filename}&quot;? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 hover:text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        setAttachmentLoading(true);
                                        await ticketService.deleteAttachmentWithFile(att.id, att.url);
                                        setAttachmentToDelete(null);
                                        await loadAttachments();
                                        setAttachmentLoading(false);
                                      }}
                                      disabled={attachmentLoading}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      {attachmentLoading ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
