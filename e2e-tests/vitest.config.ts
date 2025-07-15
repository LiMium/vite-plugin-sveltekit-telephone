import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    hookTimeout: 20000,
    setupFiles: ['./vitest.setup.ts'],
  },
})
