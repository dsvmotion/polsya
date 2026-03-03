import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          const modulePath = id.split("node_modules/")[1];
          if (!modulePath) return "vendor-misc";

          if (
            modulePath.startsWith("react/") ||
            modulePath.startsWith("react-dom/") ||
            modulePath.startsWith("scheduler/")
          ) {
            return "vendor-react";
          }

          if (modulePath.startsWith("@radix-ui/")) {
            return "vendor-radix";
          }

          if (
            modulePath.startsWith("@react-google-maps/api/") ||
            modulePath.startsWith("@googlemaps/markerclusterer/")
          ) {
            return "vendor-maps";
          }

          if (
            modulePath.startsWith("@supabase/supabase-js/") ||
            modulePath.startsWith("@supabase/") ||
            modulePath.startsWith("@tanstack/react-query/")
          ) {
            return "vendor-data";
          }

          if (modulePath.startsWith("xlsx/")) {
            return "vendor-xlsx";
          }

          if (modulePath.startsWith("recharts/")) {
            return "vendor-charts";
          }

          if (modulePath.startsWith("lucide-react/")) {
            return "vendor-icons";
          }

          if (
            modulePath.startsWith("react-hook-form/") ||
            modulePath.startsWith("@hookform/") ||
            modulePath.startsWith("zod/")
          ) {
            return "vendor-forms";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
