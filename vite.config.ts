import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    // Photo readings call Claude and can legitimately take a while; the
    // default Vercel function timeout is too short. See docs/PLAN.md Phase 5
    // and meals.functions.ts's ANALYSIS_TIMEOUT_MS, which is sized to fit a
    // failed-first-attempt-then-retry inside this budget.
    nitro({ preset: "vercel", vercel: { functions: { maxDuration: 60 } } }),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      outDir: ".vercel/output/static",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Dr. K's Kitchen",
        short_name: "Dr. K's Kitchen",
        description: "Naturopathic meal readings for Dr. Katelyn Mudry's patients",
        theme_color: "#d97a52",
        background_color: "#fbf6ec",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
