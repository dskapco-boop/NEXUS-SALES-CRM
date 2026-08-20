import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

export function useInvoice(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*), quotation:quotations(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
