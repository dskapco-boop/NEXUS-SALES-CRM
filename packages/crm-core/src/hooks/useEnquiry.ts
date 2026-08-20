import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];

export function useEnquiry(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["enquiry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*, lead:leads(*), items:enquiry_items(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
