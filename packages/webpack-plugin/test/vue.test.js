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
}, 8000)
