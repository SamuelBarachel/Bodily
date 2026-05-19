import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const basePath = process.env.BASE_PATH || "/";
const rawPort = process.env.PORT;

if (rawPort !== undefined && (rawPort.trim() === "" || Number.isNaN(Number(rawPort)) || Number(rawPort) <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const devPort = rawPort ? Number(rawPort) : undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    ...(devPort ? { port: devPort } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    ...(devPort ? { port: devPort } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
