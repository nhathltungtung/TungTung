import { defineConfig } from "vitest/config";
import path from "path";

process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vgjruzqappijlavpfwho.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnanJ1enFhcHBpamxhdnBmd2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNjY4MDYsImV4cCI6MjEwNDk0MjgwNn0.wP8kNdls13Afye0DJZ-3bQNoPEm359VTFg_oeW4oMxU";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
