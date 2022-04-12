import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import path from 'path'
export default defineConfig({
  plugins: [Vue()],
  test: {
    include: ['**/*.test.*'],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './lib'),
    },
  },
})
