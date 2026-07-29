import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

/**
 * T11.1 — Vitest configuration for unit testing.
 *
 * Provides fast unit testing with:
 * - Angular component testing support
 * - Happy DOM for browser environment simulation
 * - Code coverage reporting
 * - Watch mode for development
 */
export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['src/**/*.e2e.spec.ts', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test-setup.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.e2e.spec.ts',
        'src/environments/**',
        '**/*.config.ts',
        '**/*.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },
  },
  resolve: {
    alias: {
      '@app': '/src/app',
      '@core': '/src/app/core',
      '@shared': '/src/app/shared',
      '@features': '/src/app/features',
      '@environments': '/src/environments',
    },
  },
});
