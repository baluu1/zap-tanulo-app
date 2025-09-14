import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// Replit dev-only pluginek csak fejlesztéskor!
import devBanner from "@replit/vite-plugin-dev-banner";
import cartographer from "@replit/vite-plugin-cartographer";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    ...(isProd ? [] : [devBanner(), cartographer(), runtimeErrorModal()]),
  ],
  // ne dobja fel az idegesítő hibamodált
  server: {
    hmr: { overlay: false },
  },
});
