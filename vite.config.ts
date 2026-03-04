import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync } from "node:fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-404",
      closeBundle() {
        const outDir = path.resolve(__dirname, "dist");
        try {
          copyFileSync(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
        } catch {}
      },
    },
  ],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
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
