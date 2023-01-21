const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')
const express = require('express')

test('adds custom middleware to server using before hook', async () => {
  function customMiddleware (req, res) {
    res.send('FOO')
  }
  const prerenderer = new Prerenderer({
    staticDir: __dirname,
    renderer: new Renderer(),
    server: {
      before: app => app.use(customMiddleware),
    },
  })
  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toMatchInlineSnapshot('"<html><head></head><body>FOO</body></html>"')
}, 7000)

test('adds custom middleware to server using hookServer', async () => {
  function customMiddleware (req, res) {
    res.send('BAR')
  }
  const prerenderer = new Prerenderer({
    staticDir: __dirname,
    renderer: new Renderer(),
  }).hookServer((server) => {
    server.getExpressServer().use(customMiddleware)
  })
  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toMatchInlineSnapshot('"<html><head></head><body>BAR</body></html>"')
}, 7000)

test('picks a different port if one is already in use', async () => {
  let port = 8900

  const warn = console.warn
  console.warn = jest.fn()
  try {
    const app = express().listen(port)
    const prerenderer = new Prerenderer({
      staticDir: __dirname,
      renderer: new Renderer(),
      server: {
        port,
      },
    }).hookServer((server) => {
      port = server.getPrerenderer().getOptions().server.port
    }, 'post-listen')
    await prerenderer.initialize()
    expect(port).not.toEqual(8900)
    await prerenderer.destroy()
    await new Promise((resolve) => app.close(resolve))

    expect(console.warn).toHaveBeenCalledWith('The provided port (8900) is already in use, so port ' + port + ' was used instead')
  } finally {
    console.warn = warn
  }
}, 7000)
