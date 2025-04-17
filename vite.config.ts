import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    workspace: ['packages/*'],
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
