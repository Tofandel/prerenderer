const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

const testDir = path.resolve(__dirname, '../../../tests/external')

test('renders routes with externally loaded script and encoding', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/external_script.html', '/external_scripté.html'])
  await prerenderer.destroy()

  expect(renderedRoutes).toMatchSnapshot()
  expect(renderedRoutes[0].html).toContain('Render Output')
  expect(renderedRoutes[1].html).toContain('Renderé the Outputé')
})
