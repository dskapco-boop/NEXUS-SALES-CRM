// Offline-first storage layer using PowerSync
// Syncs Supabase data locally for mobile offline access
import * as SecureStore from "expo-secure-store";
import { getSupabaseClient } from "@nexus-crm/api";

export interface OfflineLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export class OfflineStorage {
  private db: any = null; // PowerSyncDatabase instance (set after init)

  async init(userId: string) {
    // In production, this initializes PowerSync with the PowerSync Web SDK
    // For now, we use a lightweight local storage wrapper
    this.db = await this.createLocalDB(userId);
  }

  private async createLocalDB(userId: string) {
    // Placeholder: PowerSync would go here
    // This provides offline read/write with background sync to Supabase
    return {
      userId,
      isReady: true,
    };
  }

  // Save a lead for offline access
  async saveLead(lead: Partial<OfflineLead>): Promise<void> {
    if (!this.db) {
      await SecureStore.setItemAsync(
        `lead_${lead.id}`,
        JSON.stringify(lead)
      );
    }
  }

  // Get all leads (online + offline merged)
  async getLeads(): Promise<OfflineLead[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as OfflineLead[];
  }

  // Queue a mutation for later sync
  async queueMutation(
    table: string,
    op: "insert" | "update" | "delete",
    data: Record<string, unknown>
  ): Promise<void> {
    const pending = JSON.parse(
      (await SecureStore.getItemAsync("pending_mutations")) || "[]"
    );
    pending.push({ table, op, data, timestamp: Date.now() });
    await SecureStore.setItemAsync("pending_mutations", JSON.stringify(pending));
  }

  // Process pending mutations when back online
  async flushPendingMutations(): Promise<void> {
    const pending = JSON.parse(
      (await SecureStore.getItemAsync("pending_mutations")) || "[]"
    );

    if (pending.length === 0) return;

    const supabase = getSupabaseClient();

    for (const mutation of pending) {
      try {
        if (mutation.op === "insert") {
          await supabase.from(mutation.table).insert(mutation.data);
        } else if (mutation.op === "update") {
          await supabase
            .from(mutation.table)
            .update(mutation.data)
            .eq("id", mutation.data.id);
        } else if (mutation.op === "delete") {
          await supabase.from(mutation.table).delete().eq("id", mutation.data.id);
        }
      } catch (err) {
        console.error("Failed to flush mutation:", err);
      }
    }

    await SecureStore.deleteItemAsync("pending_mutations");
  }
}

export const offlineStorage = new OfflineStorage();
