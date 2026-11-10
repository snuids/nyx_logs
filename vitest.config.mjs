import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import pkg from './package.json'

// `App.tsx` reads `__APP_VERSION__`, which Vite injects at build time (see vite.config.ts).
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Every source file counts, including the ones no test loads: without `include`, c8 only
      // measures what was imported, which is how this repository read 85 % while two thirds of
      // its code had no test at all.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
      // The floor is the level actually measured — raise it as tests land, never lower it.
      // Mesure du 10/11/2026 : 97,11 % instructions, 89,85 % branches, 100 % fonctions,
      // 98,89 % lignes — sur 63 tests. Le plancher est le niveau mesure, jamais un voeu.
      thresholds: {
        statements: 96,
        branches: 89,
        functions: 99,
        lines: 98,
      },
    },
  },
})
