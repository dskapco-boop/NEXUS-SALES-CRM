// Nexus CRM - Google Drive Integration Service
// Uploads documents to Google Drive with ISO 9001 QMS folder structure

import { getEnv } from "@nexus-crm/config";

const env = getEnv();

// ISO 9001:2015 QMS folder structure
const QMS_FOLDERS: Record<string, string> = {
  invoices: env.GOOGLE_DRIVE_INVOICES_FOLDER_ID || "",
  reports: env.GOOGLE_DRIVE_REPORTS_FOLDER_ID || "",
  quotations: env.GOOGLE_DRIVE_QUOTES_FOLDER_ID || "",
  orders: env.GOOGLE_DRIVE_ORDERS_FOLDER_ID || "",
  iso_evidence: env.GOOGLE_DRIVE_QMS_FOLDER_ID || "",
  audit_reports: env.GOOGLE_DRIVE_AUDITS_FOLDER_ID || "",
};

export interface DocumentUploadParams {
  documentType:
    | "invoice"
    | "completion_report"
    | "quotation"
    | "order"
    | "iso_evidence"
    | "audit_report";
  entityType: string;
  entityId: string;
  data: Record<string, any>;
}

export interface DocumentUploadResult {
  success: boolean;
  fileId?: string;
  fileLink?: string;
  error?: string;
}

export class GoogleDriveService {
  private serviceAccountEmail: string;
  private privateKey: string;

  constructor() {
    this.serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
    this.privateKey = env.GOOGLE_PRIVATE_KEY || "";
  }

  /**
   * Upload a document to Google Drive with QMS folder structure
   */
  async uploadDocument(params: DocumentUploadParams): Promise<DocumentUploadResult> {
    try {
      // Generate document content
      let htmlContent: string;
      let fileName: string;

      switch (params.documentType) {
        case "invoice":
          htmlContent = this.generateInvoiceHTML(params.data);
          fileName = `INV-${params.data.invoice_number || params.entityId.substring(0, 8)}.pdf`;
          break;
        case "completion_report":
          htmlContent = this.generateCompletionReportHTML(params.data);
          fileName = `COMPREPORT-${params.entityId.substring(0, 8)}.pdf`;
          break;
        case "quotation":
          htmlContent = this.generateQuotationHTML(params.data);
          fileName = `QUO-${params.data.quote_number || params.entityId.substring(0, 8)}.pdf`;
          break;
        case "order":
          htmlContent = this.generateOrderHTML(params.data);
          fileName = `ORD-${params.entityId.substring(0, 8)}.pdf`;
          break;
        case "iso_evidence":
          htmlContent = this.generateIsoEvidenceHTML(params.data);
          fileName = `EVIDENCE-${params.entityId.substring(0, 8)}.pdf`;
          break;
        case "audit_report":
          htmlContent = this.generateAuditReportHTML(params.data);
          fileName = `AUDIT-${params.entityId.substring(0, 8)}.pdf`;
          break;
        default:
          htmlContent = JSON.stringify(params.data, null, 2);
          fileName = `${params.entityType}-${params.entityId.substring(0, 8)}.pdf`;
      }

      const folderId = this.getFolderId(params.documentType);
      const result = await this.uploadFile(fileName, htmlContent, folderId);

      if (result.success) {
        return {
          success: true,
          fileId: result.fileId,
          fileLink: `https://drive.google.com/file/d/${result.fileId}/view`,
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Google Drive upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Upload file to Google Drive via Supabase Edge Function
   */
  private async uploadFile(
    fileName: string,
    content: string,
    folderId: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      // Use Supabase Edge Function to upload to Google Drive
      // This approach keeps the service account key secure on the server
      const { getSupabaseClient } = await import("@nexus-crm/api");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.functions.invoke(
        "google-drive-upload",
        {
          body: {
            document_type: fileName.toLowerCase().includes("inv") ? "invoice" :
                          fileName.toLowerCase().includes("report") ? "completion_report" :
                          fileName.toLowerCase().includes("quo") ? "quotation" :
                          fileName.toLowerCase().includes("audit") ? "audit_report" :
                          fileName.toLowerCase().includes("evidence") ? "iso_evidence" :
                          "order",
            document_id: fileName,
            entity_type: "document",
            entity_id: fileName,
            content,
            file_name: fileName,
            folder_id: folderId,
          },
        }
      );

      if (error) throw error;
      return { success: true, fileId: data?.file_id };
    } catch (error) {
      console.error("Edge function upload failed:", error);
      // Fallback: try direct upload (only works if service account key is available client-side)
      return await this.uploadFileDirect(fileName, content, folderId);
    }
  }

  /**
   * Fallback: Direct upload (requires service account credentials exposed)
   * NOT recommended for production - use edge function instead
   */
  private async uploadFileDirect(
    fileName: string,
    content: string,
    folderId: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    if (!this.serviceAccountEmail || !this.privateKey) {
      return {
        success: false,
        error: "Google service account credentials not configured",
      };
    }

    try {
      // In production, this would use a proper JWT library
      // For now, return a placeholder error
      return {
        success: false,
        error: "Direct upload requires server-side edge function",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  private getFolderId(documentType: string): string {
    const mapping: Record<string, string> = {
      invoice: "invoices",
      completion_report: "reports",
      quotation: "quotations",
      order: "orders",
      iso_evidence: "iso_evidence",
      audit_report: "audit_reports",
    };
    return QMS_FOLDERS[mapping[documentType]] || "";
  }

  // Document HTML generators
  private generateInvoiceHTML(data: any): string {
    const total = data.total_amount || 0;
    const amountDue = (data.amount_paid || 0) - total;
    const today = new Date().toISOString().split("T")[0];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${data.invoice_number || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 2px solid #0052cc; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .total-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>#${data.invoice_number || ""}</h2>
        </div>
        <div class="section">
          <p><strong>Date:</strong> ${data.invoice_date || today}</p>
          <p><strong>Due Date:</strong> ${data.due_date || ""}</p>
          <p><strong>Status:</strong> ${data.status || "draft"}</p>
          <p><strong>Currency:</strong> ${data.currency || "AED"}</p>
        </div>
        <div class="section">
          <h3>Bill To:</h3>
          <p>${data.account_name || "N/A"}</p>
          <p>${data.billing_address || ""}</p>
        </div>
        ${data.line_items ? `<div class="section">
          <h3>Line Items:</h3>
          <table style="width:100%; border-collapse: collapse;">
            <tr><th style="border: 1px solid #ddd; padding: 8px;">Item</th><th style="border: 1px solid #ddd; padding: 8px;">Qty</th><th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th><th style="border: 1px solid #ddd; padding: 8px;">Total</th></tr>
            ${data.line_items.map((item: any) => `<tr><td style="border: 1px solid #ddd; padding: 8px;">${item.name || ""}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity || ""}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.unit_price || ""}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.line_total || ""}</td></tr>`).join("")}
          </table>
        </div>` : ""}
        <div class="total-box">
          <p><strong>Subtotal:</strong> ${data.currency || "AED"} ${total.toFixed(2)}</p>
          <p><strong>Paid:</strong> ${data.currency || "AED"} ${(data.amount_paid || 0).toFixed(2)}</p>
          <p><strong>Amount Due:</strong> ${data.currency || "AED"} ${Math.abs(amountDue).toFixed(2)}</p>
        </div>
        <div class="footer">
          <p><strong>ISO 9001:2015 compliant document</strong> - Automatically stored in QMS</p>
          <p>Generated: ${today}</p>
          <p>This document has been uploaded to Google Drive as part of the Nexus CRM QMS documentation system.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateCompletionReportHTML(data: any): string {
    const today = new Date().toISOString().split("T")[0];

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Completion Report</title></head>
      <body>
        <h1>COMPLETION REPORT</h1>
        <h2>${data.report_title || ""}</h2>
        <p><strong>Signed:</strong> ${data.signoff_date || "Pending"}</p>
        <p><strong>Status:</strong> ${data.signoff_status || "Pending"}</p>
        <hr/>
        <h3>Delivery Details</h3>
        <p>${data.delivery_details || ""}</p>
        <h3>Scope Delivered</h3>
        <p>${data.scope_delivered || ""}</p>
        <h3>Client Feedback</h3>
        <p>${data.client_feedback || ""}</p>
        <hr/>
        <p><strong>ISO 9001:2015 compliant document</strong> - Automatically stored in QMS</p>
        <p>Generated: ${today}</p>
      </body>
      </html>
    `;
  }

  private generateQuotationHTML(data: any): string {
    const today = new Date().toISOString().split("T")[0];

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Quotation ${data.quote_number || ""}</title></head>
      <body>
        <h1>QUOTATION</h1>
        <h2>#${data.quote_number || ""}</h2>
        <p>Date: ${data.quote_date || today}</p>
        <p>Valid Until: ${data.valid_until || ""}</p>
        <p>Total: ${data.currency || "AED"} ${data.total_amount || "0.00"}</p>
        <p>Status: ${data.status || "draft"}</p>
        <hr/>
        <p><strong>ISO 9001:2015 compliant document</strong> - Automatically stored in QMS</p>
        <p>Generated: ${today}</p>
      </body>
      </html>
    `;
  }

  private generateOrderHTML(data: any): string {
    const today = new Date().toISOString().split("T")[0];

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Order ${data.order_number || ""}</title></head>
      <body>
        <h1>SALES ORDER</h1>
        <h2>#${data.order_number || ""}</h2>
        <p>Order Date: ${data.order_date || today}</p>
        <p>Status: ${data.status || "draft"}</p>
        <p>Total: ${data.currency || "AED"} ${data.total_amount || "0.00"}</p>
        <hr/>
        <p><strong>ISO 9001:2015 compliant document</strong> - Automatically stored in QMS</p>
        <p>Generated: ${today}</p>
      </body>
      </html>
    `;
  }

  private generateIsoEvidenceHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Evidence Document</title></head>
      <body>
        <h1>DOCUMENT OF CONFORMANCE EVIDENCE</h1>
        <h2>${data.title || ""}</h2>
        <p>Type: ${data.document_type || ""}</p>
        <p>Version: ${data.version || "1.0"}</p>
        <p>Uploaded: ${data.uploaded_at || new Date().toISOString()}</p>
        <hr/>
        <p><strong>ISO 9001:2015 compliant evidence document</strong> - Automatically stored in QMS</p>
      </body>
      </html>
    `;
  }

  private generateAuditReportHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Audit Report</title></head>
      <body>
        <h1>AUDIT REPORT</h1>
        <p>Date: ${data.scheduled_date || data.actual_date || new Date().toISOString().split("T")[0]}</p>
        <p>Type: ${data.type || ""}</p>
        <p>Auditor: ${data.auditor || ""}</p>
        <p>Status: ${data.status || ""}</p>
        <hr/>
        <p><strong>ISO 9001:2015 compliant audit record</strong> - Automatically stored in QMS</p>
      </body>
      </html>
    `;
  }
}

export const googleDriveService = new GoogleDriveService();
