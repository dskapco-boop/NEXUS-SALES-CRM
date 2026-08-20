import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();

    // Get the MCP client for Zoho
    const mcpEndpoint = Deno.env.get("ZOHO_MCP_ENDPOINT")!;
    const zohoApiKey = Deno.env.get("ZOHO_API_KEY")!;

    // Sync all pending entities to Zoho via MCP
    const results = {};

    // Sync leads to contacts
    const { data: pendingLeads } = await supabase
      .from("leads")
      .select("*")
      .is("zoho_contact_id", null)
      .limit(10);

    for (const lead of pendingLeads ?? []) {
      const response = await fetch(mcpEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${zohoApiKey}`,
        },
        body: JSON.stringify({
          tool: "create_contact",
          arguments: {
            display_name: `${lead.first_name} ${lead.last_name}`,
            email: lead.email,
            phone: lead.phone,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await supabase
          .from("leads")
          .update({ zoho_contact_id: result.id })
          .eq("id", lead.id);
        results[`lead_${lead.id}`] = "synced";
      } else {
        results[`lead_${lead.id}`] = "failed";
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Zoho sync completed",
      results
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
