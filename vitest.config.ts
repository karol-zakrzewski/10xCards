import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/{unit,integration}/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      exclude: ["tests/**", "src/**/*.d.ts"],
    },
  },
});
