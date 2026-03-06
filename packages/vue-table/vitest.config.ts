import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/env.d.ts',
        'src/index.ts',
        'src/unstyled.ts'
      ],
      thresholds: {
        lines: 85.8,
        functions: 93.56,
        branches: 79.55,
        statements: 85.8,
        autoUpdate: true
      }
    }
  }
});