import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];

export function useQuotation(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["quotation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*, items:quotation_items(*), sales_order:sales_orders(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
