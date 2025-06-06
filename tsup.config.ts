import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  platform: 'node',
  tsconfig: './tsconfig.json',
  target: 'node16',
  shims: false,
  dts: true,
  legacyOutput: true,
  onSuccess: 'echo {\\"type\\": \\"module\\"} > dist/esm/package.json',
});
