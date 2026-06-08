import { ticketService } from "@/services/ticket-service";
import { assigneeService, departmentService } from "@/services/user-service";

/** A reference entity is any operator-managed lookup row: just an id and a name. */
export interface ReferenceEntity {
  id: number;
  name: string;
}

/**
 * One descriptor fully specifies a reference list: its copy plus its four
 * data-access calls, each adapted to take/return plain values. The card, modal,
 * and hook only ever see `name: string` in and `ReferenceEntity` out — never a
 * given service's payload shape.
 */
export interface ReferenceDescriptor {
  /** Stable key; also the React list key and the new-input element id. */
  key: string;
  /** Plural, title-cased: the card heading and the "Manage {title}" modal title. */
  title: string;
  /** Lower-case singular noun used in copy ("Enter {singular} name"). */
  singular: string;
  /** Lower-case plural noun used in copy ("No {plural} found"). */
  plural: string;
  /** Optional modal subtitle; defaults to "Create, edit, and delete {plural}." */
  description?: string;
  list: () => Promise<ReferenceEntity[]>;
  create: (name: string) => Promise<ReferenceEntity>;
  update: (id: number, name: string) => Promise<ReferenceEntity>;
  remove: (id: number) => Promise<void>;
}

/**
 * The single place every reference list is declared. Adding a new operator-
 * managed lookup table is one entry here — no new card or modal component.
 *
 * Two service contracts are normalized to the same descriptor shape:
 *   - ticketService.* take/return an object payload ({ name })
 *   - assignee/department services take a bare name string
 */
export const referenceDescriptors: ReferenceDescriptor[] = [
  {
    key: "categories",
    title: "Categories",
    singular: "category",
    plural: "categories",
    description: "Create, edit, and delete ticket categories.",
    list: () => ticketService.getTicketCategories(),
    create: (name) => ticketService.createTicketCategory({ name }),
    update: (id, name) => ticketService.updateTicketCategory(id, { name }),
    remove: (id) => ticketService.deleteTicketCategory(id),
  },
  {
    key: "priorities",
    title: "Priorities",
    singular: "priority",
    plural: "priorities",
    description: "Create, edit, and delete ticket priorities.",
    list: () => ticketService.getTicketPriorities(),
    create: (name) => ticketService.createTicketPriority({ name }),
    update: (id, name) => ticketService.updateTicketPriority(id, { name }),
    remove: (id) => ticketService.deleteTicketPriority(id),
  },
  {
    key: "assignees",
    title: "Assignees",
    singular: "assignee",
    plural: "assignees",
    description: "Create, edit, and delete assignees for ticket assignment.",
    list: () => assigneeService.getAllAssignees(),
    create: (name) => assigneeService.createAssignee(name),
    update: (id, name) => assigneeService.updateAssignee(id, name),
    remove: (id) => assigneeService.deleteAssignee(id),
  },
  {
    key: "departments",
    title: "Departments",
    singular: "department",
    plural: "departments",
    description: "Create, edit, and delete departments for user organization.",
    list: () => departmentService.getAllDepartments(),
    create: (name) => departmentService.createDepartment(name),
    update: (id, name) => departmentService.updateDepartment(id, name),
    remove: (id) => departmentService.deleteDepartment(id),
  },
  {
    key: "demarcation",
    title: "Demarcations",
    singular: "demarcation",
    plural: "demarcations",
    list: () => ticketService.getDemarcations(),
    create: (name) => ticketService.createDemarcation({ name }),
    update: (id, name) => ticketService.updateDemarcation(id, { name }),
    remove: (id) => ticketService.deleteDemarcation(id),
  },
  {
    key: "link",
    title: "Links",
    singular: "link",
    plural: "links",
    list: () => ticketService.getLinks(),
    create: (name) => ticketService.createLink({ name }),
    update: (id, name) => ticketService.updateLink(id, { name }),
    remove: (id) => ticketService.deleteLink(id),
  },
  {
    key: "site",
    title: "Sites",
    singular: "site",
    plural: "sites",
    list: () => ticketService.getSites(),
    create: (name) => ticketService.createSite({ name }),
    update: (id, name) => ticketService.updateSite(id, { name }),
    remove: (id) => ticketService.deleteSite(id),
  },
  {
    key: "service-type",
    title: "Service Types",
    singular: "service type",
    plural: "service types",
    list: () => ticketService.getServiceTypes(),
    create: (name) => ticketService.createServiceType({ name }),
    update: (id, name) => ticketService.updateServiceType(id, { name }),
    remove: (id) => ticketService.deleteServiceType(id),
  },
  {
    key: "detection-source",
    title: "Detection Sources",
    singular: "detection source",
    plural: "detection sources",
    list: () => ticketService.getDetectionSources(),
    create: (name) => ticketService.createDetectionSource({ name }),
    update: (id, name) => ticketService.updateDetectionSource(id, { name }),
    remove: (id) => ticketService.deleteDetectionSource(id),
  },
  {
    key: "traffic-impact",
    title: "Traffic Impacts",
    singular: "traffic impact",
    plural: "traffic impacts",
    list: () => ticketService.getTrafficImpacts(),
    create: (name) => ticketService.createTrafficImpact({ name }),
    update: (id, name) => ticketService.updateTrafficImpact(id, { name }),
    remove: (id) => ticketService.deleteTrafficImpact(id),
  },
];
