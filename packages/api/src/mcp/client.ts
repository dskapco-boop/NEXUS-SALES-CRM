import { getEnv } from "@nexus-crm/config";
import type { ZohoMCPTools, ZohoLineItem } from "./zoho-tools";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPCallResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPClient {
  private baseUrl: string;
  private apiKey?: string;
  private toolsCache: MCPTool[] | null = null;
  private requestId = 0;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.MCP_SERVER_URL;
    this.apiKey = env.MCP_API_KEY;
  }

  private nextId(): number {
    return ++this.requestId;
  }

  private async request(body: any): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.toolsCache) return this.toolsCache;

    const response = await this.request({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "tools/list",
      params: {},
    });

    this.toolsCache = response.result?.tools || [];
    return this.toolsCache;
  }

  async callTool(name: string, args: Record<string, any>): Promise<string> {
    const response = await this.request({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "tools/call",
      params: { name, arguments: args },
    }) as MCPCallResponse;

    if (response.error) {
      throw new Error(`MCP tool error: ${response.error.message}`);
    }

    if (response.result?.isError) {
      throw new Error(`MCP tool returned error: ${response.result.content[0]?.text}`);
    }

    return response.result?.content?.[0]?.text || "";
  }

  private parseToolResponse<T>(response: string): T {
    try {
      return JSON.parse(response);
    } catch {
      return response as any;
    }
  }

  // ---- Contacts ----
  async createContact(data: ZohoMCPTools["create_contact"]): Promise<any> {
    const response = await this.callTool("create_contact", data);
    return this.parseToolResponse(response);
  }

  async getContact(contactId: string): Promise<any> {
    const response = await this.callTool("get_contact", { contact_id: contactId });
    return this.parseToolResponse(response);
  }

  async listContacts(params: ZohoMCPTools["list_contacts"] = {}): Promise<any[]> {
    const response = await this.callTool("list_contacts", params);
    const result = this.parseToolResponse<{ contacts: any[] }>(response);
    return result.contacts || [];
  }

  // ---- Items ----
  async createItem(data: ZohoMCPTools["create_item"]): Promise<any> {
    const response = await this.callTool("create_item", data);
    return this.parseToolResponse(response);
  }

  async listItems(params: ZohoMCPTools["list_items"] = {}): Promise<any[]> {
    const response = await this.callTool("list_items", params);
    const result = this.parseToolResponse<{ items: any[] }>(response);
    return result.items || [];
  }

  // ---- Estimates ----
  async createEstimate(data: ZohoMCPTools["create_estimate"]): Promise<any> {
    const response = await this.callTool("create_estimate", data);
    return this.parseToolResponse(response);
  }

  async getEstimate(estimateId: string): Promise<any> {
    const response = await this.callTool("get_estimate", { estimate_id: estimateId });
    return this.parseToolResponse(response);
  }

  async listEstimates(params: ZohoMCPTools["list_estimates"] = {}): Promise<any[]> {
    const response = await this.callTool("list_estimates", params);
    const result = this.parseToolResponse<{ estimates: any[] }>(response);
    return result.estimates || [];
  }

  async emailEstimate(estimateId: string, toMailIds: string[], subject?: string, body?: string): Promise<void> {
    await this.callTool("email_estimate", { estimate_id: estimateId, to_mail_ids: toMailIds, subject, body });
  }

  // ---- Invoices ----
  async createInvoice(data: ZohoMCPTools["create_invoice"]): Promise<any> {
    const response = await this.callTool("create_invoice", data);
    return this.parseToolResponse(response);
  }

  async getInvoice(invoiceId: string): Promise<any> {
    const response = await this.callTool("get_invoice", { invoice_id: invoiceId });
    return this.parseToolResponse(response);
  }

  async voidInvoice(invoiceId: string): Promise<void> {
    await this.callTool("void_invoice", { invoice_id: invoiceId });
  }

  // ---- Sales Orders ----
  async createSalesOrder(data: ZohoMCPTools["create_salesorder"]): Promise<any> {
    const response = await this.callTool("create_salesorder", data);
    return this.parseToolResponse(response);
  }

  // ---- Payments ----
  async createPayment(data: ZohoMCPTools["create_payment"]): Promise<any> {
    const response = await this.callTool("create_payment", data);
    return this.parseToolResponse(response);
  }

  // ---- Sync ----
  async syncCustomers(direction: "push" | "pull" | "both" = "both", since?: string): Promise<any> {
    return this.callTool("sync_customers", { direction, since });
  }

  async syncInvoices(direction: "push" | "pull" | "both" = "both", since?: string): Promise<any> {
    return this.callTool("sync_invoices", { direction, since });
  }

  // ---- Transform Helpers (CRM -> Zoho) ----
  transformLeadToZohoContact(lead: any): ZohoMCPTools["create_contact"] {
    return {
      contact_name: `${lead.first_name} ${lead.last_name}`,
      company_name: lead.company,
      email: lead.email,
      phone: lead.phone,
      mobile: lead.mobile,
      contact_type: "customer",
      notes: lead.notes,
      custom_fields: lead.custom_fields,
    };
  }

  transformQuoteToZohoEstimate(quote: any, lineItems: any[]): ZohoMCPTools["create_estimate"] {
    return {
      customer_id: quote.zoho_contact_id || "",
      estimate_number: quote.quote_number,
      date: quote.quote_date,
      expiry_date: quote.valid_until,
      status: quote.status === "draft" ? "draft" : "sent",
      line_items: lineItems.map((item, index) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.unit_price,
        discount: item.discount_percent,
        tax_percentage: item.tax_rate,
      })) as ZohoLineItem[],
      notes: quote.notes,
      terms: quote.terms_conditions,
      discount: quote.discount_percent,
    };
  }

  transformInvoiceToZohoInvoice(invoice: any, lineItems: any[]): ZohoMCPTools["create_invoice"] {
    return {
      customer_id: invoice.zoho_contact_id || "",
      invoice_number: invoice.invoice_number,
      date: invoice.invoice_date,
      due_date: invoice.due_date,
      status: invoice.status === "draft" ? "draft" : "sent",
      line_items: lineItems.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.unit_price,
        discount: item.discount_percent,
        tax_percentage: item.tax_rate,
      })) as ZohoLineItem[],
      notes: invoice.notes,
      terms: invoice.terms_conditions,
    };
  }

  private mapPaymentMethod(method: string): NonNullable<ZohoMCPTools["create_payment"]["payment_mode"]> {
    const mapping: Record<string, NonNullable<ZohoMCPTools["create_payment"]["payment_mode"]>> = {
      cash: "cash",
      bank_transfer: "bank_transfer",
      card: "stripe",
      cheque: "check",
      online: "paypal",
      other: "other",
    };
    return mapping[method] || "other";
  }
}

export const mcpClient = new MCPClient();
