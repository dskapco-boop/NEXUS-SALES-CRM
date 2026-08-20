/// <reference types="https://esm.sh/@supabase/functions-js@2/types" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Zoho Webhook Edge Function starting...");

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();

    // Verify webhook signature (Zoho sends X-com-zoho-webhook-signature header)
    const signature = req.headers.get("X-com-zoho-webhook-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    // Determine webhook type
    const webhookType = body.webhook_type || body.type;

    switch (webhookType) {
      case "payment":
        // Payment received in Zoho Books -> update invoice status
        const { invoice_id, amount, payment_mode } = body;
        await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_amount: supabase.rpc("add_paid_amount", {
              invoice_id: invoice_id,
              amount: amount,
            }),
          })
          .eq("zoho_invoice_id", body.zoho_invoice_id);
        break;

      case "quote":
        // Quote updated in Zoho -> update local quotation
        await supabase
          .from("quotations")
          .update({
            status: mapZohoQuoteStatus(body.status),
            zoho_quote_id: body.id,
          })
          .eq("zoho_quote_id", body.id);
        break;

      case "invoice":
        // Invoice updated in Zoho -> update local invoice
        await supabase
          .from("invoices")
          .update({
            status: mapZohoInvoiceStatus(body.status),
            zoho_invoice_id: body.id,
          })
          .eq("zoho_invoice_id", body.id);
        break;

      default:
        console.log("Unknown webhook type:", webhookType);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(String(err), { status: 500 });
  }
});

function mapZohoQuoteStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "draft",
    sent: "sent",
    accepted: "accepted",
    rejected: "rejected",
    expired: "expired",
  };
  return map[status] ?? "draft";
}

function mapZohoInvoiceStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "draft",
    sent: "sent",
    paid: "paid",
    partial_paid: "paid",
    overdue: "overdue",
    voided: "void",
  };
  return map[status] ?? "draft";
}
