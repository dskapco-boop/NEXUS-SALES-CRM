import { AuthProvider } from "react-admin";
import { getSupabaseClient } from "@nexus-crm/api";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    if (error) return false;
    return true;
  },

  logout: async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    return;
  },

  checkAuth: async () => {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session ? Promise.resolve() : Promise.reject();
  },

  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(""),
};
