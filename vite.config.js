import { resolve } from "path";
import { defineConfig } from "vite";

// Set VITE_BASE_PATH=/your-repo-name/ in GitHub Actions if the site is not at domain root.
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
      },
    },
  },
});
