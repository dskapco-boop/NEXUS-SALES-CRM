import { Redirect } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { QueryProvider } from "@nexus-crm/crm-core";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/_auth/login" />;
  }

  return <QueryProvider>{children as any}</QueryProvider>;
}
