const path = require('path')
const express = require('express')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

const testDir = path.resolve(__dirname, '../../../tests/api_call')

test('uses the result of a fetch call', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterDocumentEvent: 'please-render', // use the magic word!
      timeout: 5000,
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/api_call.html'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
  expect(renderedRoutes[0].html).toContain('This is the result of the api call')
})

test('proxies a request to an alternative server', async () => {
  const app = express()
  const proxyPort = 3041

  app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.send('<p>Proxied</p>')
  })

  let server
  await new Promise((resolve) => {
    server = app.listen(proxyPort, resolve)
  })

  const prerenderer = new Prerenderer({
    staticDir: testDir,
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${proxyPort}`,
          changeOrigin: true,
          pathRewrite: {
            '^/api': '',
          },
        },
      },
    },
    renderer: new Renderer({
      renderAfterDocumentEvent: 'please-render',
      timeout: 5000,
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/api_call.html'])
  await prerenderer.destroy()
  await new Promise((resolve) => server.close(resolve))
  expect(renderedRoutes).toMatchSnapshot()
  expect(renderedRoutes[0].html).toContain('Proxied')
})
