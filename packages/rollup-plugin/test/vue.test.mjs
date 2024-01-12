import { build } from 'vite'

import path from 'path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

jest.setTimeout(15000)

test('Basic vue', async () => {
  const config = (await import('./vite.config.mjs')).default

  const rollupOutput = await build(config(path.resolve(__dirname, '../examples/vue3')))

  const index = rollupOutput.output.find((out) => out.fileName === 'index.html')
  expect(index).toBeTruthy()
  expect(index.name).toBe('Prerendered route /')
  expect(index.source).toContain('provides you with all information you need to get started')
})

test('Routes and events', async () => {
  const config = (await import('./vite.config.mjs')).default

  const rollupOutput = await build(config(path.resolve(__dirname, '../examples/vue3'), {
    routes: ['/', '/about', '/404'],
    renderer: '@prerenderer/renderer-puppeteer',
    rendererOptions: { renderAfterDocumentEvent: 'render', renderAfterTime: 1000 },
  }))

  const index = rollupOutput.output.find((out) => out.fileName === 'index.html')
  expect(index).toBeTruthy()
  expect(index.name).toBe('Prerendered route /')
  expect(index.source).toContain('provides you with all information you need to get started')

  const about = rollupOutput.output.find((out) => out.fileName === 'about/index.html')
  expect(about).toBeTruthy()
  expect(about.name).toBe('Prerendered route /about')
  expect(about.source).toContain('This is an about page')

  const error = rollupOutput.output.find((out) => out.fileName === '404/index.html')
  expect(error).toBeTruthy()
  expect(error.name).toBe('Prerendered route /404')
  expect(error.source).toContain('Error 404: the page you\'re looking for doesn\'t exist')
}, 10000)

test('Fallback', async () => {
  const config = (await import('./vite.config.mjs')).default

  const rollupOutput = await build(config(path.resolve(__dirname, '../examples/vue3'), {
    routes: ['/', '/about', '/404'],
    fallback: 'Backup',
    renderer: '@prerenderer/renderer-puppeteer',
    rendererOptions: { renderAfterDocumentEvent: 'render', renderAfterTime: 1000 },
  }))

  const index = rollupOutput.output.find((out) => out.fileName === 'index.html')
  expect(index).toBeTruthy()
  expect(index.name).toBe('Prerendered route /')

  const indexFallback = rollupOutput.output.find((out) => out.fileName === 'indexBackup.html')
  expect(indexFallback).toBeTruthy()
  expect(indexFallback.source).not.toContain('provides you with all information you need to get started')
  expect(indexFallback.source).toContain('<div id="app"></div>')
})
