import { getZohoMCPClient, ZohoTool } from "@nexus-crm/api";

// Sync Layer: pushes CRM entities to Zoho Books via MCP adapter

export class ZohoSyncLayer {
  private readonly mcpClient = getZohoMCPClient();

  // ---- QUOTATION -> ZOHO QUOTE ----
  async syncQuotationToQuote(quotationId: string): Promise<{ zohoId: string } | null> {
    // Fetch full quotation with items from Supabase
    const supabase = (await import("@nexus-crm/api")).getSupabaseClient();
    const { data: quotation, error } = await supabase
      .from("quotations")
      .select(`*, items:quotation_items(*)`)
      .eq("id", quotationId)
      .single();

    if (error || !quotation) {
      console.error("Failed to fetch quotation:", error);
      return null;
    }

    try {
      const response = await this.mcpClient.call<{ id: string }>(
        ZohoTool.CREATE_QUOTE,
        {
          customer_id: quotation.customer?.zoho_customer_id ?? "",
          line_items: quotation.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            tax_id: item.tax_id ?? "",
          })) ?? [],
          reference_number: quotation.quote_number,
        }
      );

      // Store the Zoho quote ID on the quotation record
      await supabase
        .from("quotations")
        .update({ zoho_quote_id: response.id })
        .eq("id", quotationId);

      return { zohoId: response.id };
    } catch (err) {
      console.error("Zoho sync error (quotation -> quote):", err);
      return null;
    }
  }

  // ---- INVOICE -> ZOHO INVOICE ----
  async syncInvoiceToZoho(invoiceId: string): Promise<{ zohoId: string } | null> {
    const { getSupabaseClient } = await import("@nexus-crm/api");
    const supabase = getSupabaseClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`*, items:invoice_items(*)`)
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      console.error("Failed to fetch invoice:", error);
      return null;
    }

    try {
      const response = await this.mcpClient.call<{ id: string }>(
        ZohoTool.CREATE_INVOICE,
        {
          customer_id: invoice.customer?.zoho_customer_id ?? "",
          line_items: invoice.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            tax_id: item.tax_id ?? "",
          })) ?? [],
          reference_number: invoice.invoice_number,
        }
      );

      await supabase
        .from("invoices")
        .update({ zoho_invoice_id: response.id })
        .eq("invoiceId", invoiceId);

      return { zohoId: response.id };
    } catch (err) {
      console.error("Zoho sync error (invoice -> invoice):", err);
      return null;
    }
  }

  // ---- LEAD -> ZOHO CONTACT ----
  async syncLeadToContact(leadId: string): Promise<{ zohoId: string } | null> {
    const { getSupabaseClient } = await import("@nexus-crm/api");
    const supabase = getSupabaseClient();

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      console.error("Failed to fetch lead:", error);
      return null;
    }

    try {
      const response = await this.mcpClient.call<{ id: string }>(
        ZohoTool.CREATE_CONTACT,
        {
          display_name: `${lead.first_name} ${lead.last_name}`,
          email: lead.email,
          phone: lead.phone,
          address: {
            city: lead.city ?? "",
            state: lead.state ?? "",
            zip: lead.postal_code ?? "",
            country: lead.country ?? "",
          },
        }
      );

      await supabase
        .from("leads")
        .update({ zoho_contact_id: response.id })
        .eq("id", leadId);

      return { zohoId: response.id };
    } catch (err) {
      console.error("Zoho sync error (lead -> contact):", err);
      return null;
    }
  }

  // ---- PAYMENT -> ZOHO PAYMENT ----
  async syncPaymentToZoho(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<{ zohoId: string } | null> {
    const { getSupabaseClient } = await import("@nexus-crm/api");
    const supabase = getSupabaseClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("zoho_invoice_id, customer:zoho_customer_id")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      console.error("Failed to fetch invoice for payment sync:", error);
      return null;
    }

    try {
      const response = await this.mcpClient.call<{ id: string }>(
        ZohoTool.CREATE_PAYMENT,
        {
          customer_id: invoice.customer as string,
          invoice_id: invoice.zoho_invoice_id,
          amount: amount,
          payment_mode: paymentMethod,
        }
      );

      return { zohoId: response.id };
    } catch (err) {
      console.error("Zoho sync error (payment):", err);
      return null;
    }
  }

  // ---- BATCH SYNC: all unsynced entities ----
  async syncAllPending(): Promise<{
    leads: number;
    quotations: number;
    invoices: number;
  }> {
    const { getSupabaseClient } = await import("@nexus-crm/api");
    const supabase = getSupabaseClient();

    const results = { leads: 0, quotations: 0, invoices: 0 };

    // Sync unsynced leads (-> contacts)
    const { data: pendingLeads } = await supabase
      .from("leads")
      .select("id")
      .is("zoho_contact_id", null)
      .not("status", "eq", "converted");
    for (const lead of pendingLeads ?? []) {
      const result = await this.syncLeadToContact(lead.id);
      if (result) results.leads++;
    }

    // Sync unsynced quotations (-> quotes)
    const { data: pendingQuotes } = await supabase
      .from("quotations")
      .select("id")
      .is("zoho_quote_id", null)
      .not("status", "eq", "draft");
    for (const q of pendingQuotes ?? []) {
      const result = await this.syncQuotationToQuote(q.id);
      if (result) results.quotations++;
    }

    // Sync unsynced invoices (-> invoices)
    const { data: pendingInvoices } = await supabase
      .from("invoices")
      .select("id")
      .is("zoho_invoice_id", null)
      .not("status", "eq", "draft");
    for (const inv of pendingInvoices ?? []) {
      const result = await this.syncInvoiceToZoho(inv.id);
      if (result) results.invoices++;
    }

    return results;
  }
}

export const zohoSync = new ZohoSyncLayer();
