import ExcelJS from "exceljs";
import { Ticket } from "@/services/ticket-service";
import { ticketService } from "@/services/ticket-service";

export interface ExportData {
  ticket: Ticket;
  assigneeName?: string;
  categoryName?: string;
  creatorName?: string;
  notes?: string;
}

export class ExportService {
  private static readonly COLUMN_HEADERS = [
    "Incident_Date",
    "Incident_ID",
    "Title",
    "Demarcation",
    "Link_Name",
    "SITE_ID",
    "Service_Type",
    "Provider",
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
    "Fault_Category",
    "Responsibility",
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

  /**
   * Export tickets to Excel file
   */
  static async exportTicketsToExcel(
    exportDataList: ExportData[],
    filename: string = "tickets_export.xlsx",
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    // Add headers
    this.setupHeaders(worksheet);

    // Add data rows
    exportDataList.forEach((exportData, index) => {
      const row = this.transformTicketToRow(exportData);
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 2, 50); // Max width of 50
    });

    // Generate file and trigger download
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

  /**
   * Setup worksheet headers with styling
   */
  private static setupHeaders(worksheet: ExcelJS.Worksheet): void {
    const headerRow = worksheet.addRow(this.COLUMN_HEADERS);

    // Style headers
    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" }, // White text
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" }, // Dark blue background
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  /**
   * Transform ticket data to Excel row
   */
  private static transformTicketToRow(exportData: ExportData): any[] {
    const { ticket, assigneeName, categoryName, creatorName, notes } = exportData;

    return [
      ticket.incidentDate || "", // Incident_Date
      ticket.id || "", // Incident_ID
      ticket.title || "", // Title
      ticket.demarcation || "", // Demarcation
      ticket.linkName || "", // Link_Name
      ticket.siteId || "", // SITE_ID
      ticket.serviceType || "", // Service_Type
      "", // Provider (not in current ticket data)
      ticket.issueStart ? "Yes" : "No", // Issue_Start
      this.formatDateTime(ticket.detectionTime), // Detection_Time
      this.formatDateTime(ticket.escalationTime), // Escalation_Time
      this.formatDateTime(ticket.providerNotifiedTime), // Provider_Notified_Time
      ticket.issueCleared ? "Yes" : "No", // Issue_Cleared
      this.formatDateTime(ticket.restorationTimeConfirmed), // Restoration_Confirmed_Time
      ticket.grossDowntimeMin || "", // Gross_Downtime_Min
      ticket.providerDowntimeMin || "", // Provider_Downtime_Min
      ticket.rootCauseLev1 || "", // Root_Cause_Level1
      ticket.rootCauseLev2 || "", // Root_Cause_Level2
      categoryName || "", // Fault_Category
      assigneeName || "", // Responsibility (Assignee Name)
      ticket.slaImpacted ? "Yes" : "No", // SLA_Impacted
      ticket.detectionSource || "", // Detection_Source
      ticket.trafficImpact || "", // Traffic_Impact
      ticket.redundancyAvailable ? "Yes" : "No", // Redundancy_Available
      ticket.partnerImpacted ? "Yes" : "No", // Partner_Impacted
      ticket.rfoReceived ? "Yes" : "No", // RFO_Received
      ticket.preventiveAction || "", // Preventive_Action
      ticket.description || "", // Description
      notes || "", // Notes
      ticket.title || "", // Remarks (using title as remarks)
      creatorName || "", // Created_By
    ];
  }

  /**
   * Format datetime string for Excel
   */
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
}

export const exportService = new ExportService();
