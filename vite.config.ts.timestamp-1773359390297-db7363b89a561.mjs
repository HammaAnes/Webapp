// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "copy-htaccess",
      closeBundle() {
        try {
          const distDir = resolve(__vite_injected_original_dirname, "dist");
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }
          const htaccessSource = resolve(__vite_injected_original_dirname, ".htaccess");
          const htaccessDest = resolve(distDir, ".htaccess");
          if (existsSync(htaccessSource)) {
            copyFileSync(htaccessSource, htaccessDest);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn("Warning: Could not copy .htaccess:", msg);
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    hmr: {
      overlay: true
    }
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
          utils: ["date-fns", "zustand"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand", "date-fns"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgY29weUZpbGVTeW5jLCBleGlzdHNTeW5jLCBta2RpclN5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB7XG4gICAgICBuYW1lOiBcImNvcHktaHRhY2Nlc3NcIixcbiAgICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGRpc3REaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpO1xuICAgICAgICAgIGlmICghZXhpc3RzU3luYyhkaXN0RGlyKSkge1xuICAgICAgICAgICAgbWtkaXJTeW5jKGRpc3REaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBodGFjY2Vzc1NvdXJjZSA9IHJlc29sdmUoX19kaXJuYW1lLCBcIi5odGFjY2Vzc1wiKTtcbiAgICAgICAgICBjb25zdCBodGFjY2Vzc0Rlc3QgPSByZXNvbHZlKGRpc3REaXIsIFwiLmh0YWNjZXNzXCIpO1xuICAgICAgICAgIGlmIChleGlzdHNTeW5jKGh0YWNjZXNzU291cmNlKSkge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGh0YWNjZXNzU291cmNlLCBodGFjY2Vzc0Rlc3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBtc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiV2FybmluZzogQ291bGQgbm90IGNvcHkgLmh0YWNjZXNzOlwiLCBtc2cpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIFwicmVhY3QtdmVuZG9yXCI6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgICAgICAgICBcInVpLXZlbmRvclwiOiBbXCJmcmFtZXItbW90aW9uXCIsIFwibHVjaWRlLXJlYWN0XCJdLFxuICAgICAgICAgIFwiZm9ybS12ZW5kb3JcIjogW1wicmVhY3QtaG9vay1mb3JtXCIsIFwicmVhY3QtZGF0ZXBpY2tlclwiXSxcbiAgICAgICAgICB1dGlsczogW1wiZGF0ZS1mbnNcIiwgXCJ6dXN0YW5kXCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCIsIFwienVzdGFuZFwiLCBcImRhdGUtZm5zXCJdLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGNBQWMsWUFBWSxpQkFBaUI7QUFDcEQsU0FBUyxlQUFlO0FBSHhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixjQUFjO0FBQ1osWUFBSTtBQUNGLGdCQUFNLFVBQVUsUUFBUSxrQ0FBVyxNQUFNO0FBQ3pDLGNBQUksQ0FBQyxXQUFXLE9BQU8sR0FBRztBQUN4QixzQkFBVSxTQUFTLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFBQSxVQUN4QztBQUNBLGdCQUFNLGlCQUFpQixRQUFRLGtDQUFXLFdBQVc7QUFDckQsZ0JBQU0sZUFBZSxRQUFRLFNBQVMsV0FBVztBQUNqRCxjQUFJLFdBQVcsY0FBYyxHQUFHO0FBQzlCLHlCQUFhLGdCQUFnQixZQUFZO0FBQUEsVUFDM0M7QUFBQSxRQUNGLFNBQVMsT0FBTztBQUNkLGdCQUFNLE1BQU0saUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSztBQUNqRSxrQkFBUSxLQUFLLHNDQUFzQyxHQUFHO0FBQUEsUUFDeEQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxhQUFhLENBQUMsaUJBQWlCLGNBQWM7QUFBQSxVQUM3QyxlQUFlLENBQUMsbUJBQW1CLGtCQUFrQjtBQUFBLFVBQ3JELE9BQU8sQ0FBQyxZQUFZLFNBQVM7QUFBQSxRQUMvQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxvQkFBb0IsV0FBVyxVQUFVO0FBQUEsRUFDM0U7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
