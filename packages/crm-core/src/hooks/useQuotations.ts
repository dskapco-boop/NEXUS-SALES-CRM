import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
type CreateQuotation = Database["public"]["Tables"]["quotations"]["Insert"];
type UpdateQuotation = Database["public"]["Tables"]["quotations"]["Update"];

export function useQuotations() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const { data: quotations, isLoading, error } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
  });

  const createQuotation = useMutation({
    mutationFn: (payload: CreateQuotation) =>
      supabase.from("quotations").insert(payload).select().single(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
  });

  const updateQuotation = useMutation({
    mutationFn: ({ id, ...patch }: UpdateQuotation & { id: string }) =>
      supabase.from("quotations").update(patch).eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
  });

  const convertToInvoice = useMutation({
    mutationFn: (id: string) =>
      supabase.rpc("convert_quotation_to_invoice", { quotation_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return { quotations, isLoading, error, createQuotation, updateQuotation, convertToInvoice };
}
