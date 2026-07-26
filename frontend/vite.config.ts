import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://crimelens-backend-50044197986.development.catalystappsail.in",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
