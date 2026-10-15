import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
  server: {
    watch: {
      // Reference checkouts and browser profiles are not application inputs.
      ignored: ['**/.reference/**'],
    },
  },
})
