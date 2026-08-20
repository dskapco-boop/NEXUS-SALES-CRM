import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
type CreateEnquiry = Database["public"]["Tables"]["enquiries"]["Insert"];
type UpdateEnquiry = Database["public"]["Tables"]["enquiries"]["Update"];

export function useEnquiries() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const { data: enquiries, isLoading, error } = useQuery({
    queryKey: ["enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Enquiry[];
    },
  });

  const createEnquiry = useMutation({
    mutationFn: (payload: CreateEnquiry) =>
      supabase.from("enquiries").insert(payload).select().single(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enquiries"] }),
  });

  const updateEnquiry = useMutation({
    mutationFn: ({ id, ...patch }: UpdateEnquiry & { id: string }) =>
      supabase.from("enquiries").update(patch).eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enquiries"] }),
  });

  const convertToSalesOrder = useMutation({
    mutationFn: (id: string) =>
      supabase.rpc("convert_enquiry_to_sales_order", { enquiry_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    },
  });

  return { enquiries, isLoading, error, createEnquiry, updateEnquiry, convertToSalesOrder };
}

export function useEnquiry(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["enquiry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Enquiry;
    },
  });
}
