import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect } from "react";
import { getSupabaseClient } from "@nexus-crm/api";

type TableName =
  | "leads"
  | "enquiries"
  | "sales_orders"
  | "quotations"
  | "invoices"
  | "users";

export function useRealtime(tableName: TableName, onData: (payload: unknown) => void) {
  const supabase = getSupabaseClient();

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${tableName}_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        onData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tableName, onData]);
}
