import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Copy index.html to 404.html for GitHub Pages SPA routing
    {
      name: "copy-404",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");
        const indexPath = resolve(distDir, "index.html");
        const notFoundPath = resolve(distDir, "404.html");
        if (existsSync(indexPath)) {
          copyFileSync(indexPath, notFoundPath);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
