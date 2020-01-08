const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../renderers/renderer-jsdom')


test(`adds custom middleware to server using before hook`, async () => {
  function customMiddleware (req, res) {
    res.send('FOO')
  }
  const CUSTOM_MIDDLEWARE_RESPONSE = '<html><head></head><body>FOO</body></html>'
  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer(),
    server: {
      before: app => app.use(customMiddleware)
    }
  })  
  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toEqual(CUSTOM_MIDDLEWARE_RESPONSE)
})
