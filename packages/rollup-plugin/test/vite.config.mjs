import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import prerender from '@prerenderer/rollup-plugin'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default (root, prerenderConfig, plugins = []) => (defineConfig({
  plugins: [vue(), prerender(prerenderConfig), ...plugins],
  root,
  logLevel: 'silent',
  build: {
    outDir: path.resolve(__dirname, './output'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
}))
