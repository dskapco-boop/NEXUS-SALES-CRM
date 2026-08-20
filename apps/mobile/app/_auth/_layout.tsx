import { Redirect } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/_app" />;
  }

  return children as any;
}
