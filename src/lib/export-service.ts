import ExcelJS from "exceljs";
import { Ticket, ticketService } from "@/services/ticket-service";

export interface ExportData {
  ticket: Ticket;
  assigneeName?: string;
  categoryName?: string;
  priorityName?: string;
  creatorName?: string;
  notes?: string;
}

interface BulkImportError {
  rowNumber: number;
  reason: string;
}

export interface BulkImportResult {
  totalRows: number;
  createdCount: number;
  failedRows: BulkImportError[];
  strictMode: boolean;
  aborted: boolean;
}

type TicketImportPayload = Omit<Ticket, "id" | "created_at" | "updated_at">;

export class ExportService {
  private static readonly TICKET_ID_PATTERN = /^Ticket#\d{11}$/;

  private static readonly TEMPLATE_COLUMN_HEADERS = [
    "Incident_Date",
    "Ticket_ID",
    "Title",
    "Demarcation",
    "Link_Name",
    "SITE_ID",
    "Service_Type",
    "Assignee",
    "Issue_Start",
    "Detection_Time",
    "Escalation_Time",
    "Provider_Notified_Time",
    "Issue_Cleared",
    "Restoration_Confirmed_Time",
    "Gross_Downtime_Min",
    "Provider_Downtime_Min",
    "Root_Cause_Level1",
    "Root_Cause_Level2",
    "Status",
    "Priority",
    "Fault_Category",
    "SLA_Impacted",
    "Detection_Source",
    "Traffic_Impact",
    "Redundancy_Available",
    "Partner_Impacted",
    "RFO_Received",
    "Preventive_Action",
    "Description",
    "Notes",
    "Remarks",
    "Created_By",
  ];

  private static readonly COLUMN_HEADERS = [
    "Incident_Date",
    "Ticket_ID",
    "Title",
    "Demarcation",
    "Link_Name",
    "SITE_ID",
    "Service_Type",
    "Assignee",
    "Issue_Start",
    "Detection_Time",
    "Escalation_Time",
    "Provider_Notified_Time",
    "Issue_Cleared",
    "Restoration_Confirmed_Time",
    "Gross_Downtime_Min",
    "Provider_Downtime_Min",
    "Root_Cause_Level1",
    "Root_Cause_Level2",
    "Status",
    "Priority",
    "Fault_Category",
    "SLA_Impacted",
    "Detection_Source",
    "Traffic_Impact",
    "Redundancy_Available",
    "Partner_Impacted",
    "RFO_Received",
    "Preventive_Action",
    "Description",
    "Notes",
    "Remarks",
    "Created_By",
  ];

  private static readonly HEADER_ALIASES = {
    Incident_Date: ["Incident_Date", "Incident Date"],
    Incident_ID: ["Incident_ID", "Incident ID", "Ticket_ID", "Ticket ID", "Ticket_Number", "Ticket Number"],
    Title: ["Title"],
    Demarcation: ["Demarcation"],
    Link_Name: ["Link_Name", "Link Name"],
    SITE_ID: ["SITE_ID", "Site_ID", "Site ID"],
    Service_Type: ["Service_Type", "Service Type"],
    Assignee: ["Assignee", "Responsibility", "Provider"],
    Issue_Start: ["Issue_Start", "Issue Start"],
    Detection_Time: ["Detection_Time", "Detection Time"],
    Escalation_Time: ["Escalation_Time", "Escalation Time"],
    Provider_Notified_Time: ["Provider_Notified_Time", "Provider Notified Time"],
    Issue_Cleared: ["Issue_Cleared", "Issue Cleared"],
    Restoration_Confirmed_Time: ["Restoration_Confirmed_Time", "Restoration Confirmed Time"],
    Gross_Downtime_Min: ["Gross_Downtime_Min", "Gross Downtime Min"],
    Provider_Downtime_Min: ["Provider_Downtime_Min", "Provider Downtime Min"],
    Root_Cause_Level1: ["Root_Cause_Level1", "Root Cause Level1", "Root Cause Level 1"],
    Root_Cause_Level2: ["Root_Cause_Level2", "Root Cause Level2", "Root Cause Level 2"],
    Status: ["Status", "Ticket_Status", "Ticket Status"],
    Priority: ["Priority", "Ticket_Priority", "Ticket Priority"],
    Fault_Category: ["Fault_Category", "Fault Category", "Category"],
    SLA_Impacted: ["SLA_Impacted", "SLA Impacted"],
    Detection_Source: ["Detection_Source", "Detection Source"],
    Traffic_Impact: ["Traffic_Impact", "Traffic Impact"],
    Redundancy_Available: ["Redundancy_Available", "Redundancy Available"],
    Partner_Impacted: ["Partner_Impacted", "Partner Impacted"],
    RFO_Received: ["RFO_Received", "RFO Received"],
    Preventive_Action: ["Preventive_Action", "Preventive Action"],
    Description: ["Description"],
    Created_By: ["Created_By", "Created By", "Creator", "Creator Email"],
  } as const;

  static async exportTicketsToExcel(
    exportDataList: ExportData[],
    filename: string = "tickets_export.xlsx",
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    this.setupHeaders(worksheet);

    exportDataList.forEach((exportData) => {
      worksheet.addRow(this.transformTicketToRow(exportData));
    });

    this.autoFitColumns(worksheet);
    await this.downloadWorkbook(workbook, filename);
  }

  static async downloadImportTemplate(filename: string = "tickets_import_template.xlsx"): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets Import Template");

    const [
      { data: categories },
      { data: priorities },
      { data: assignees },
      { data: users },
      { data: demarcations },
      { data: links },
      { data: sites },
      { data: serviceTypes },
      { data: detectionSources },
      { data: trafficImpacts },
    ] = await Promise.all([
      ticketService.getTicketCategories(),
      ticketService.getTicketPriorities(),
      ticketService.getAssignees(),
      ticketService.getUsers(),
      ticketService.getDemarcations(),
      ticketService.getLinks(),
      ticketService.getSites(),
      ticketService.getServiceTypes(),
      ticketService.getDetectionSources(),
      ticketService.getTrafficImpacts(),
    ]);

    this.setupHeaders(worksheet, this.TEMPLATE_COLUMN_HEADERS);

    worksheet.addRow([
      "2026-04-20",
      "Ticket#20260420001",
      "Sample ticket title",
      "CORE",
      "Link-A",
      "SITE-001",
      "MPLS",
      (assignees || [])[0]?.name || "",
      "Yes",
      "2026-04-20T08:30:00Z",
      "2026-04-20T09:00:00Z",
      "2026-04-20T09:15:00Z",
      "No",
      "",
      "45",
      "15",
      "Transmission",
      "Fiber Cut",
      "OPEN",
      "HIGH",
      "BUG",
      "Yes",
      "NMS",
      "Major",
      "Yes",
      "No",
      "No",
      "Increase route diversity",
      "Sample description",
      "",
      "",
      (users || [])[0]?.email || "",
    ]);

    worksheet.addRow([
      "",
      "",
      "Another sample",
      "",
      "",
      "",
      "",
      "",
      "No",
      "",
      "",
      "",
      "No",
      "",
      "",
      "",
      "",
      "",
      "IN_PROGRESS",
      "MEDIUM",
      "SUPPORT",
      "No",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    const optionSheet = workbook.addWorksheet("Template Options", { state: "veryHidden" });
    const yesNoOptions = ["Yes", "No"];
    const statusOptions = ["OPEN", "IN_PROGRESS", "CLOSED"];
    const creatorOptions = (users || []).flatMap((user) => [user.email, user.name]).filter(Boolean) as string[];

    const demarcationFormula = this.populateOptionColumn(
      optionSheet,
      "A",
      "Demarcation",
      (demarcations || []).map((item) => item.name),
    );
    const linkFormula = this.populateOptionColumn(
      optionSheet,
      "B",
      "Link_Name",
      (links || []).map((item) => item.name),
    );
    const siteFormula = this.populateOptionColumn(
      optionSheet,
      "C",
      "SITE_ID",
      (sites || []).map((item) => item.name),
    );
    const serviceTypeFormula = this.populateOptionColumn(
      optionSheet,
      "D",
      "Service_Type",
      (serviceTypes || []).map((item) => item.name),
    );
    const assigneeFormula = this.populateOptionColumn(
      optionSheet,
      "E",
      "Assignee",
      (assignees || []).map((item) => item.name),
    );
    const issueStartFormula = this.populateOptionColumn(optionSheet, "F", "Issue_Start", yesNoOptions);
    const issueClearedFormula = this.populateOptionColumn(optionSheet, "G", "Issue_Cleared", yesNoOptions);
    const statusFormula = this.populateOptionColumn(optionSheet, "H", "Status", statusOptions);
    const priorityFormula = this.populateOptionColumn(
      optionSheet,
      "I",
      "Priority",
      (priorities || []).map((item) => item.name.toUpperCase()),
    );
    const categoryFormula = this.populateOptionColumn(
      optionSheet,
      "J",
      "Fault_Category",
      (categories || []).map((item) => item.name.toUpperCase()),
    );
    const slaImpactedFormula = this.populateOptionColumn(optionSheet, "K", "SLA_Impacted", yesNoOptions);
    const detectionSourceFormula = this.populateOptionColumn(
      optionSheet,
      "L",
      "Detection_Source",
      (detectionSources || []).map((item) => item.name),
    );
    const trafficImpactFormula = this.populateOptionColumn(
      optionSheet,
      "M",
      "Traffic_Impact",
      (trafficImpacts || []).map((item) => item.name),
    );
    const redundancyFormula = this.populateOptionColumn(optionSheet, "N", "Redundancy_Available", yesNoOptions);
    const partnerImpactedFormula = this.populateOptionColumn(optionSheet, "O", "Partner_Impacted", yesNoOptions);
    const rfoReceivedFormula = this.populateOptionColumn(optionSheet, "P", "RFO_Received", yesNoOptions);
    const createdByFormula = this.populateOptionColumn(optionSheet, "Q", "Created_By", [...new Set(creatorOptions)]);

    this.applyDropdownValidation(worksheet, "Demarcation", demarcationFormula);
    this.applyDropdownValidation(worksheet, "Link_Name", linkFormula);
    this.applyDropdownValidation(worksheet, "SITE_ID", siteFormula);
    this.applyDropdownValidation(worksheet, "Service_Type", serviceTypeFormula);
    this.applyDropdownValidation(worksheet, "Assignee", assigneeFormula);
    this.applyDropdownValidation(worksheet, "Issue_Start", issueStartFormula);
    this.applyDropdownValidation(worksheet, "Issue_Cleared", issueClearedFormula);
    this.applyDropdownValidation(worksheet, "Status", statusFormula);
    this.applyDropdownValidation(worksheet, "Priority", priorityFormula);
    this.applyDropdownValidation(worksheet, "Fault_Category", categoryFormula);
    this.applyDropdownValidation(worksheet, "SLA_Impacted", slaImpactedFormula);
    this.applyDropdownValidation(worksheet, "Detection_Source", detectionSourceFormula);
    this.applyDropdownValidation(worksheet, "Traffic_Impact", trafficImpactFormula);
    this.applyDropdownValidation(worksheet, "Redundancy_Available", redundancyFormula);
    this.applyDropdownValidation(worksheet, "Partner_Impacted", partnerImpactedFormula);
    this.applyDropdownValidation(worksheet, "RFO_Received", rfoReceivedFormula);
    this.applyDropdownValidation(worksheet, "Created_By", createdByFormula);
    this.applyTicketIdValidation(worksheet, "Incident_ID");

    this.autoFitColumns(worksheet);
    await this.downloadWorkbook(workbook, filename);
  }

  static async importTicketsFromExcel(file: File, options?: { strictMode?: boolean }): Promise<BulkImportResult> {
    const strictMode = options?.strictMode ?? false;
    const workbook = new ExcelJS.Workbook();
    const fileBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("No worksheet found in the uploaded file");
    }

    const [
      { data: categories, error: categoriesError },
      { data: assignees, error: assigneesError },
      { data: priorities, error: prioritiesError },
      { data: users, error: usersError },
    ] = await Promise.all([
      ticketService.getTicketCategories(),
      ticketService.getAssignees(),
      ticketService.getTicketPriorities(),
      ticketService.getUsers(),
    ]);

    if (categoriesError || assigneesError || prioritiesError || usersError) {
      throw new Error("Failed to load ticket reference data for import");
    }

    const categoryMap = new Map((categories || []).map((item) => [item.name.toLowerCase(), item.id]));
    const assigneeMap = new Map((assignees || []).map((item) => [item.name.toLowerCase(), item.id]));
    const priorityMap = new Map((priorities || []).map((item) => [item.name.toLowerCase(), item.id]));
    const userMap = new Map<string, string>();

    (users || []).forEach((user) => {
      if (user.name) userMap.set(user.name.toLowerCase(), user.id);
      if (user.email) userMap.set(user.email.toLowerCase(), user.id);
    });

    const headerMap = this.createHeaderMap(worksheet.getRow(1));
    const ticketsToCreate: TicketImportPayload[] = [];
    const failedRows: BulkImportError[] = [];
    let totalRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || this.isRowEmpty(row)) {
        return;
      }

      totalRows += 1;

      const title = this.getCellString(row, headerMap, "Title");
      if (!title) {
        failedRows.push({ rowNumber, reason: "Title is required" });
        return;
      }

      const categoryName = this.getCellString(row, headerMap, "Fault_Category");
      const priorityName = this.getCellString(row, headerMap, "Priority");
      const assigneeName = this.getCellString(row, headerMap, "Assignee");
      const creatorValue = this.getCellString(row, headerMap, "Created_By");
      const rawStatus = this.getCellString(row, headerMap, "Status");
      const status = this.normalizeStatus(rawStatus);
      const ticketId = this.getCellString(row, headerMap, "Incident_ID");

      if (categoryName && !categoryMap.has(categoryName.toLowerCase())) {
        failedRows.push({ rowNumber, reason: `Unknown category: ${categoryName}` });
        return;
      }

      if (priorityName && !priorityMap.has(priorityName.toLowerCase())) {
        failedRows.push({ rowNumber, reason: `Unknown priority: ${priorityName}` });
        return;
      }

      if (assigneeName && !assigneeMap.has(assigneeName.toLowerCase())) {
        failedRows.push({ rowNumber, reason: `Unknown assignee: ${assigneeName}` });
        return;
      }

      if (creatorValue && !userMap.has(creatorValue.toLowerCase())) {
        failedRows.push({ rowNumber, reason: `Unknown creator: ${creatorValue}` });
        return;
      }

      if (rawStatus && !status) {
        failedRows.push({ rowNumber, reason: `Invalid status: ${rawStatus}` });
        return;
      }

      if (ticketId && !this.isValidTicketId(ticketId)) {
        failedRows.push({ rowNumber, reason: `Invalid ticket ID format: ${ticketId}` });
        return;
      }

      ticketsToCreate.push({
        title,
        status: status || "OPEN",
        description: this.getCellString(row, headerMap, "Description"),
        category_id: categoryName ? categoryMap.get(categoryName.toLowerCase()) : undefined,
        priority_id: priorityName ? priorityMap.get(priorityName.toLowerCase()) : undefined,
        assignee_id: assigneeName ? assigneeMap.get(assigneeName.toLowerCase()) : undefined,
        creator_id: creatorValue ? userMap.get(creatorValue.toLowerCase()) : undefined,
        ticket_id: ticketId,
        incidentDate: this.parseDateValue(this.getCellValue(row, headerMap, "Incident_Date")),
        demarcation: this.getCellString(row, headerMap, "Demarcation"),
        linkName: this.getCellString(row, headerMap, "Link_Name"),
        siteId: this.getCellString(row, headerMap, "SITE_ID"),
        serviceType: this.getCellString(row, headerMap, "Service_Type"),
        issueStart: this.parseBoolean(this.getCellValue(row, headerMap, "Issue_Start")),
        detectionTime: this.parseDateValue(this.getCellValue(row, headerMap, "Detection_Time")),
        escalationTime: this.parseDateValue(this.getCellValue(row, headerMap, "Escalation_Time")),
        providerNotifiedTime: this.parseDateValue(this.getCellValue(row, headerMap, "Provider_Notified_Time")),
        issueCleared: this.parseBoolean(this.getCellValue(row, headerMap, "Issue_Cleared")),
        restorationTimeConfirmed: this.parseDateValue(this.getCellValue(row, headerMap, "Restoration_Confirmed_Time")),
        grossDowntimeMin: this.parseNumber(this.getCellValue(row, headerMap, "Gross_Downtime_Min")),
        providerDowntimeMin: this.parseNumber(this.getCellValue(row, headerMap, "Provider_Downtime_Min")),
        rootCauseLev1: this.getCellString(row, headerMap, "Root_Cause_Level1"),
        rootCauseLev2: this.getCellString(row, headerMap, "Root_Cause_Level2"),
        slaImpacted: this.parseBoolean(this.getCellValue(row, headerMap, "SLA_Impacted")),
        detectionSource: this.getCellString(row, headerMap, "Detection_Source"),
        trafficImpact: this.getCellString(row, headerMap, "Traffic_Impact"),
        redundancyAvailable: this.parseBoolean(this.getCellValue(row, headerMap, "Redundancy_Available")),
        partnerImpacted: this.parseBoolean(this.getCellValue(row, headerMap, "Partner_Impacted")),
        rfoReceived: this.parseBoolean(this.getCellValue(row, headerMap, "RFO_Received")),
        preventiveAction: this.getCellString(row, headerMap, "Preventive_Action"),
      });
    });

    if (strictMode && failedRows.length > 0) {
      return {
        totalRows,
        createdCount: 0,
        failedRows,
        strictMode,
        aborted: true,
      };
    }

    if (ticketsToCreate.length > 0) {
      const { data, error } = await ticketService.createTicketsBulk(ticketsToCreate);
      if (error) {
        throw new Error(error.message || "Failed to import tickets");
      }

      return {
        totalRows,
        createdCount: data?.length || 0,
        failedRows,
        strictMode,
        aborted: false,
      };
    }

    return {
      totalRows,
      createdCount: 0,
      failedRows,
      strictMode,
      aborted: false,
    };
  }

  private static setupHeaders(worksheet: ExcelJS.Worksheet, headers: string[] = this.COLUMN_HEADERS): void {
    const headerRow = worksheet.addRow(headers);

    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  private static transformTicketToRow(exportData: ExportData): unknown[] {
    const { ticket, assigneeName, categoryName, priorityName, creatorName, notes } = exportData;

    return [
      ticket.incidentDate || "",
      ticket.ticket_id || ticket.ticket_number || ticket.id || "",
      ticket.title || "",
      ticket.demarcation || "",
      ticket.linkName || "",
      ticket.siteId || "",
      ticket.serviceType || "",
      assigneeName || "",
      ticket.issueStart ? "Yes" : "No",
      this.formatDateTime(ticket.detectionTime),
      this.formatDateTime(ticket.escalationTime),
      this.formatDateTime(ticket.providerNotifiedTime),
      ticket.issueCleared ? "Yes" : "No",
      this.formatDateTime(ticket.restorationTimeConfirmed),
      ticket.grossDowntimeMin || "",
      ticket.providerDowntimeMin || "",
      ticket.rootCauseLev1 || "",
      ticket.rootCauseLev2 || "",
      ticket.status || "OPEN",
      priorityName || "",
      categoryName || "",
      ticket.slaImpacted ? "Yes" : "No",
      ticket.detectionSource || "",
      ticket.trafficImpact || "",
      ticket.redundancyAvailable ? "Yes" : "No",
      ticket.partnerImpacted ? "Yes" : "No",
      ticket.rfoReceived ? "Yes" : "No",
      ticket.preventiveAction || "",
      ticket.description || "",
      notes || "",
      ticket.title || "",
      creatorName || "",
    ];
  }

  private static formatDateTime(dateString?: string): string {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return dateString;
    }
  }

  private static createHeaderMap(headerRow: ExcelJS.Row): Map<string, number> {
    const headerMap = new Map<string, number>();

    headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const headerValue = String(cell.value ?? "").trim();
      if (headerValue) {
        headerMap.set(this.normalizeHeader(headerValue), columnNumber);
      }
    });

    return headerMap;
  }

  private static normalizeHeader(header: string): string {
    return header.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  private static findColumnIndex(headerMap: Map<string, number>, key: keyof typeof ExportService.HEADER_ALIASES) {
    const aliases = this.HEADER_ALIASES[key] || [key];

    for (const alias of aliases) {
      const mappedIndex = headerMap.get(this.normalizeHeader(alias));
      if (mappedIndex) {
        return mappedIndex;
      }
    }

    return undefined;
  }

  private static getCellValue(
    row: ExcelJS.Row,
    headerMap: Map<string, number>,
    key: keyof typeof ExportService.HEADER_ALIASES,
  ): unknown {
    const columnIndex = this.findColumnIndex(headerMap, key);
    if (!columnIndex) {
      return undefined;
    }

    const rawValue = row.getCell(columnIndex).value;
    if (rawValue && typeof rawValue === "object" && "text" in rawValue) {
      return rawValue.text;
    }

    return rawValue;
  }

  private static getCellString(
    row: ExcelJS.Row,
    headerMap: Map<string, number>,
    key: keyof typeof ExportService.HEADER_ALIASES,
  ): string | undefined {
    const cellValue = this.getCellValue(row, headerMap, key);
    if (cellValue === null || typeof cellValue === "undefined") {
      return undefined;
    }

    const value = String(cellValue).trim();
    return value.length ? value : undefined;
  }

  private static parseBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["yes", "true", "1", "y"].includes(normalized)) return true;
      if (["no", "false", "0", "n"].includes(normalized)) return false;
    }
    return undefined;
  }

  private static parseNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace(/,/g, "").trim());
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private static parseDateValue(value: unknown): string | undefined {
    if (!value) return undefined;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const excelEpochOffset = 25569;
      const millisecondsPerDay = 86400 * 1000;
      const date = new Date((value - excelEpochOffset) * millisecondsPerDay);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
    }

    return undefined;
  }

  private static normalizeStatus(value?: string): string | undefined {
    if (!value) return undefined;

    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");
    return ["OPEN", "IN_PROGRESS", "CLOSED"].includes(normalized) ? normalized : undefined;
  }

  private static isRowEmpty(row: ExcelJS.Row): boolean {
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value !== null && typeof cell.value !== "undefined" && String(cell.value).trim() !== "") {
        hasValue = true;
      }
    });
    return !hasValue;
  }

  private static populateOptionColumn(
    worksheet: ExcelJS.Worksheet,
    column: string,
    header: string,
    values: string[],
  ): string {
    worksheet.getCell(`${column}1`).value = header;
    const uniqueValues = [...new Set(values.filter((value) => value && value.trim().length > 0))];

    uniqueValues.forEach((value, index) => {
      worksheet.getCell(`${column}${index + 2}`).value = value;
    });

    const lastRow = Math.max(uniqueValues.length + 1, 2);
    return `'Template Options'!$${column}$2:$${column}$${lastRow}`;
  }

  private static applyDropdownValidation(
    worksheet: ExcelJS.Worksheet,
    header: keyof typeof ExportService.HEADER_ALIASES,
    formulaRange: string,
    startRow: number = 2,
    endRow: number = 500,
  ): void {
    const headerMap = this.createHeaderMap(worksheet.getRow(1));
    const columnIndex = this.findColumnIndex(headerMap, header);

    if (!columnIndex) {
      return;
    }

    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      worksheet.getCell(rowNumber, columnIndex).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formulaRange],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Invalid value",
        error: `Please select a valid option for ${header}.`,
      };
    }
  }

  private static applyTicketIdValidation(
    worksheet: ExcelJS.Worksheet,
    header: keyof typeof ExportService.HEADER_ALIASES,
    startRow: number = 2,
    endRow: number = 500,
  ): void {
    const headerMap = this.createHeaderMap(worksheet.getRow(1));
    const columnIndex = this.findColumnIndex(headerMap, header);

    if (!columnIndex) {
      return;
    }

    const columnLetter = this.getColumnLetter(columnIndex);

    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      const cellRef = `$${columnLetter}$${rowNumber}`;
      worksheet.getCell(rowNumber, columnIndex).dataValidation = {
        type: "custom",
        allowBlank: true,
        formulae: [
          `OR(${cellRef}="",AND(LEFT(${cellRef},7)="Ticket#",LEN(${cellRef})=18,ISNUMBER(VALUE(MID(${cellRef},8,11)))))`,
        ],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Invalid ticket ID",
        error: "Use the format Ticket#YYYYMMDDNNN.",
      };
    }
  }

  private static isValidTicketId(value: string): boolean {
    return this.TICKET_ID_PATTERN.test(value.trim());
  }

  private static getColumnLetter(columnNumber: number): string {
    let current = columnNumber;
    let columnLetter = "";

    while (current > 0) {
      const remainder = (current - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      current = Math.floor((current - 1) / 26);
    }

    return columnLetter;
  }

  private static autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  private static async downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
