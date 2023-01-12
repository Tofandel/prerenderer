const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

const testDir = path.resolve(__dirname, '../../../tests')

test('renders after 600ms, before should-already-be-rendered is dispatched', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: 'dynamic/dynamic.html',
    renderer: new Renderer({
      renderAfterTime: 600,
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
  expect(renderedRoutes[0].html).toContain('Render Output')
  expect(renderedRoutes[0].html).not.toContain('Oh no, it\'s too late!')
})

test('renders after 1200ms, after should-already-be-rendered is dispatched', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: 'dynamic/dynamic.html',
    renderer: new Renderer({
      renderAfterTime: 1200,
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
  expect(renderedRoutes[0].html).not.toContain('Render Output')
  expect(renderedRoutes[0].html).toContain('Oh no, it\'s too late!')
})
