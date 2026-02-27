import os from "node:os";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import solid from "vite-plugin-solid";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const portValue = Number.parseInt(process.env.PORT ?? "", 10);
const devPort = Number.isFinite(portValue) && portValue > 0 ? portValue : 5173;
const allowedHosts = new Set<string>();
const envAllowedHosts = process.env.VITE_ALLOWED_HOSTS ?? "";

const addHost = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return;
  allowedHosts.add(trimmed);
};

envAllowedHosts.split(",").forEach(addHost);
addHost(process.env.OPENWORK_PUBLIC_HOST ?? null);
const hostname = os.hostname();
addHost(hostname);
const shortHostname = hostname.split(".")[0];
if (shortHostname && shortHostname !== hostname) {
  addHost(shortHostname);
}

export default defineConfig({
  plugins: [tailwindcss(), solid()],
  resolve: {
    alias: {
      "@tauri-apps/plugin-deep-link": resolveTauriModule("@tauri-apps/plugin-deep-link"),
      "@tauri-apps/plugin-dialog": resolveTauriModule("@tauri-apps/plugin-dialog"),
      "@tauri-apps/plugin-http": resolveTauriModule("@tauri-apps/plugin-http"),
      "@tauri-apps/plugin-opener": resolveTauriModule("@tauri-apps/plugin-opener"),
      "@tauri-apps/plugin-process": resolveTauriModule("@tauri-apps/plugin-process"),
      "@tauri-apps/plugin-updater": resolveTauriModule("@tauri-apps/plugin-updater"),
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    ...(allowedHosts.size > 0 ? { allowedHosts: Array.from(allowedHosts) } : {}),
  },
  build: {
    target: "esnext",
  },
});

// Helper to resolve Tauri modules in pnpm workspace
function resolveTauriModule(moduleName: string): string {
  const baseDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  
  // Try standard pnpm path
  const pnpmPath = join(baseDir, "..", "node_modules", ".pnpm");
  if (existsSync(pnpmPath)) {
    try {
      const dirs = readdirSync(pnpmPath);
      for (const dir of dirs) {
        if (dir.includes(moduleName.split("/")[1] ?? "")) {
          const modulePath = join(pnpmPath, dir, "node_modules", moduleName);
          if (existsSync(modulePath) && lstatSync(modulePath).isDirectory()) {
            // Check for dist-js (Tauri plugins) or lib
            const distJsPath = join(modulePath, "dist-js", "index.js");
            if (existsSync(distJsPath)) {
              return join(modulePath, "dist-js", "index.js");
            }
            const libPath = join(modulePath, "lib", "index.js");
            if (existsSync(libPath)) {
              return join(modulePath, "lib", "index.js");
            }
          }
        }
      }
    } catch {
      // Fallback to default behavior
    }
  }
  
  return moduleName;
}
