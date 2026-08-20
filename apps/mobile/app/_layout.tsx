import { AuthProvider } from "../src/hooks/useAuth";

export default function Root({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
