import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    hookTimeout: 60_000,
    testTimeout: 90_000,
    pool: "forks",
    passWithNoTests: true,
    include: ["tests/**/test-*.{js,ts}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
