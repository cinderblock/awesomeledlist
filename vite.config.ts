import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, existsSync, readdirSync, mkdirSync, statSync } from "fs";

// Recursively copy directory
function copyDirSync(src: string, dest: string) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Copy index.html to 404.html for GitHub Pages SPA routing
    // and copy database images to dist
    {
      name: "post-build-copy",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");
        const indexPath = resolve(distDir, "index.html");
        const notFoundPath = resolve(distDir, "404.html");

        // Copy 404.html
        if (existsSync(indexPath)) {
          copyFileSync(indexPath, notFoundPath);
        }

        // Copy database images to dist/images
        const databaseDir = resolve(__dirname, "database");
        const categories = readdirSync(databaseDir).filter(
          (d) => !d.startsWith("_") && statSync(resolve(databaseDir, d)).isDirectory()
        );

        for (const category of categories) {
          const imagesDir = resolve(databaseDir, category, "images");
          if (existsSync(imagesDir)) {
            const destDir = resolve(distDir, "images", category);
            copyDirSync(imagesDir, destDir);
          }
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
