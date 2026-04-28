import { defineConfig } from "vitest/config";
import path from "node:path";

/** `INTEGRATION_DATABASE_URL` 있을 때: `npm run test:integration` */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
