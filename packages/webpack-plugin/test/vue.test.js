const webpack = require('webpack')

const config = require('./webpack.config')
const path = require('path')

test('Basic vue', (resolve) => {
  webpack(config(path.resolve(__dirname, '../examples/vue3')), (err, stats) => {
    if (err) {
      throw err
    } else if (stats.hasErrors()) {
      throw stats.toString()
    }

    const assets = stats.toJson().assets
    const files = assets.map(x => x.name)
    const index = assets.find((a) => a.name === 'index.html')

    expect(files).toContain('index.html')
    expect(files).toContain('main.js')
    expect(index.info.prerendered).toBeTruthy()
    resolve()
  })
})

test('Routes and events', (resolve) => {
  webpack(config(path.resolve(__dirname, '../examples/vue3'), {
    routes: ['/', '/foo', '/bar'],
    renderer: require('@prerenderer/renderer-jsdom'),
    rendererOptions: { renderAfterDocumentEvent: 'render' },
  }), (err, stats) => {
    if (err) {
      throw err
    } else if (stats.hasErrors()) {
      throw stats.toString()
    }

    const assets = stats.toJson().assets
    const files = assets.map(x => x.name)
    const index = assets.find((a) => a.name === 'index.html')

    expect(files).toContain('index.html')
    expect(files).toContain('main.js')
    expect(index.info.prerendered).toBeTruthy()
    resolve()
  })
})

test('Fallback', (resolve) => {
  webpack(config(path.resolve(__dirname, '../examples/vue3'), {
    routes: ['/', '/foo', '/bar'],
    renderer: require('@prerenderer/renderer-jsdom'),
    rendererOptions: { renderAfterDocumentEvent: 'render' },
    fallback: 'Backup',
  }), (err, stats) => {
    if (err) {
      throw err
    } else if (stats.hasErrors()) {
      throw stats.toString()
    }

    const assets = stats.toJson().assets
    const files = assets.map(x => x.name)
    const index = assets.find((a) => a.name === 'index.html')
    const indexFallback = assets.find((a) => a.name === 'indexBackup.html')

    expect(files).toContain('index.html')
    expect(files).toContain('indexBackup.html')
    expect(files).toContain('main.js')
    expect(index.info.prerendered).toBeTruthy()
    expect(index.size).toBeGreaterThan(500)
    expect(indexFallback.size).toBeLessThan(600)
    expect(indexFallback.size).toBeGreaterThan(300)
    resolve()
  })
})
