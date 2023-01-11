const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

test('renders route with special character in path', async () => {
  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/tést.html'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})
