import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      include: ['packages/**/src/**'],
      all: true,
      reporter: ['html', 'lcovonly', 'text-summary'],
    },
    logHeapUsage: true,
    environment: 'node',
    globals: true,
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
    },
    globalSetup: 'vitest.setup.ts',
    watch: false,
  },
});
