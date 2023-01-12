const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

test('adds custom middleware to server using before hook', async () => {
  function customMiddleware (req, res) {
    res.send('FOO')
  }
  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
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
