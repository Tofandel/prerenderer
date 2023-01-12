const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

const testDir = path.resolve(__dirname, '../../../tests/external')

test('renders routes with externally loaded script and encoding', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/external_script.html', '/external_scripté.html'])
  await prerenderer.destroy()

  expect(renderedRoutes).toMatchSnapshot()
})
