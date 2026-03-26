import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-htaccess",
      closeBundle() {
        try {
          const distDir = resolve(__dirname, "dist");
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }
          const htaccessSource = resolve(__dirname, ".htaccess");
          const htaccessDest = resolve(distDir, ".htaccess");
          if (existsSync(htaccessSource)) {
            copyFileSync(htaccessSource, htaccessDest);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn("Warning: Could not copy .htaccess:", msg);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "lucide-react"],
          "form-vendor": ["react-hook-form", "react-datepicker"],
          utils: ["date-fns", "zustand"],
          "pdf-vendor": ["jspdf", "jspdf-autotable"],
          "chart-vendor": ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand", "date-fns"],
  },
});
