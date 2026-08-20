import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type CreateInvoice = Database["public"]["Tables"]["invoices"]["Insert"];
type UpdateInvoice = Database["public"]["Tables"]["invoices"]["Update"];

export function useInvoices() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const createInvoice = useMutation({
    mutationFn: (payload: CreateInvoice) =>
      supabase.from("invoices").insert(payload).select().single(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const updateInvoice = useMutation({
    mutationFn: ({ id, ...patch }: UpdateInvoice & { id: string }) =>
      supabase.from("invoices").update(patch).eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const recordPayment = useMutation({
    mutationFn: ({ invoiceId, amount, paymentMethod }: { invoiceId: string; amount: number; paymentMethod: string }) =>
      supabase.rpc("record_payment", {
        invoice_id: invoiceId,
        amount_received: amount,
        method: paymentMethod,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return { invoices, isLoading, error, createInvoice, updateInvoice, recordPayment };
}
