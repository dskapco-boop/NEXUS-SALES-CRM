import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";

type SalesOrder = Database["public"]["Tables"]["sales_orders"]["Row"];
type CreateSalesOrder = Database["public"]["Tables"]["sales_orders"]["Insert"];
type UpdateSalesOrder = Database["public"]["Tables"]["sales_orders"]["Update"];

export function useSalesOrders() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const { data: salesOrders, isLoading, error } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SalesOrder[];
    },
  });

  const createSalesOrder = useMutation({
    mutationFn: (payload: CreateSalesOrder) =>
      supabase.from("sales_orders").insert(payload).select().single(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salesOrders"] }),
  });

  const updateSalesOrder = useMutation({
    mutationFn: ({ id, ...patch }: UpdateSalesOrder & { id: string }) =>
      supabase.from("sales_orders").update(patch).eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salesOrders"] }),
  });

  const convertToQuotation = useMutation({
    mutationFn: (id: string) =>
      supabase.rpc("convert_sales_order_to_quotation", { order_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  return { salesOrders, isLoading, error, createSalesOrder, updateSalesOrder, convertToQuotation };
}

export function useSalesOrder(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["salesOrder", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*, items:order_items(*), lead:leads(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
