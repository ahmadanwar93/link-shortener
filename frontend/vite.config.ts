import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
// controls how Vite builds and serves the app
export default defineConfig({
  // transform JSX, process CSS
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Runtime: import "@/foo" → "./src/foo"
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
