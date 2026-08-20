import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Load .env and .env.local manually from project root (for local dev)
const rootDir = path.resolve(__dirname, "../..");
const envFiles = [
  path.resolve(rootDir, ".env"),
  path.resolve(rootDir, ".env.local"),
];
let envVars: Record<string, string> = {};

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        envVars[key] = value; // .env.local takes priority over .env
      }
    }
  }
}

// Helper: read env var from process.env first (Vercel/servers), then from .env file
function getEnvVal(key: string): string {
  return process.env[key] || envVars[key] || "";
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@nexus-crm/api": path.resolve(rootDir, "packages/api/src"),
      "@nexus-crm/crm-core": path.resolve(rootDir, "packages/crm-core/src"),
      "@nexus-crm/database": path.resolve(rootDir, "packages/database/src"),
      "@nexus-crm/ui": path.resolve(rootDir, "packages/ui/src"),
      "@nexus-crm/config": path.resolve(rootDir, "packages/config/src"),
    },
    // Dedupe React to prevent "Invalid hook call" from dual React copies
    // Root has react@18.2.0 while admin expects react@18.3.1
    dedupe: ["react", "react-dom"],
  },
  define: {
    __APP_NAME__: JSON.stringify("Nexus CRM Admin"),
    "import.meta.env.SUPABASE_URL": JSON.stringify(getEnvVal("SUPABASE_URL")),
    "import.meta.env.SUPABASE_ANON_KEY": JSON.stringify(getEnvVal("SUPABASE_ANON_KEY")),
    "import.meta.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  server: {
    port: 5174,
    host: "0.0.0.0",
    strictPort: false,
    proxy: {
      // Proxy OmniRoute API for local development
      "/api/omniroute": {
        target: "http://localhost:20128",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/omniroute/, "/api"),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
