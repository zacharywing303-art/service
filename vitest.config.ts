import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts', 'apps/*/src/__tests__/**/*.ts'],
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
