const path = require('path')
const express = require('express')
const Prerenderer = require('../../')
const Renderer = require('../../../renderer-puppeteer')

const app = express()
const proxyPort = 3040

app.get('*', (req, res) => {
  res.send('<p>Render Output</p>')
})

const server = app.listen(proxyPort)

const EXPECTED_HTML = '<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body><p>Render Output</p></body></html>'

test('proxies a request to an alternative server', async () => {
  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${proxyPort}`,
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          }
        }
      }
    },
    renderer: new Renderer({
      renderAfterDocumentEvent: 'please-render'
    })
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  prerenderer.destroy()
  server.close()
  expect(renderedRoutes).toEqual(expectedResult)
})
