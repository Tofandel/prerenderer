const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

const testDir = path.resolve(__dirname, '../../../tests/history')

test('changes the route property when history.pushState is used to change the page URL', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: path.resolve(testDir, 'push-state.html'),
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})

test('changes the route property when history.replaceState is used to change the page URL', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: path.resolve(testDir, 'replace-state.html'),
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})

test('maintains the correct route value when history.pushState is followed by history.back', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: path.resolve(testDir, 'push-state-back.html'),
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})
