import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-public-safe",
      apply: "build",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");
        const publicDir = resolve(__dirname, "public");
        if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

        const copyDirSafe = (src: string, dest: string) => {
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          try {
            const entries = readdirSync(src);
            for (const entry of entries) {
              const srcPath = join(src, entry);
              const destPath = join(dest, entry);
              try {
                const st = statSync(srcPath);
                if (st.isDirectory()) {
                  copyDirSafe(srcPath, destPath);
                } else {
                  try {
                    copyFileSync(srcPath, destPath);
                  } catch (e) {
                    console.warn(`Warning: Skipping inaccessible file: ${srcPath}`);
                  }
                }
              } catch (e) {
                console.warn(`Warning: Cannot stat ${srcPath}, skipping`);
              }
            }
          } catch (e) {
            console.warn(`Warning: Cannot read dir ${src}`);
          }
        };

        copyDirSafe(publicDir, distDir);

        try {
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
  publicDir: false,
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
    proxy: {
      "/api": {
        target: "https://coffice.dz",
        changeOrigin: true,
        secure: true,
      },
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
