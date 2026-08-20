import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@nexus-crm/config";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const env = getEnv();

  supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "nexus-crm",
      },
    },
  });

  return supabaseInstance;
}

export function getSupabaseAdminClient(): SupabaseClient {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });
}

// Auth helpers
export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const client = getSupabaseClient();
  return client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getSupabaseClient();
  return client.auth.onAuthStateChange(callback);
}

// Realtime subscriptions
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const client = getSupabaseClient();
  let channel = client.channel(`realtime:${table}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter,
      },
      callback
    )
    .subscribe();

  return () => client.removeChannel(channel);
}
