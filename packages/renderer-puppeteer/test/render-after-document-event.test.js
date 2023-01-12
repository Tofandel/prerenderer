const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

const testDir = path.resolve(__dirname, '../../../tests/dynamic')

test('renders after please-render is dispatched, before should-already-be-rendered is dispatched', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterDocumentEvent: 'please-render',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toContain('Render Output')
  expect(renderedRoutes[0].html).not.toContain('Oh no, it\'s too late!')
  expect(renderedRoutes).toMatchSnapshot()
})

test('renders after after should-already-be-rendered is dispatched', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterDocumentEvent: 'should-already-be-rendered',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).not.toContain('Render Output')
  expect(renderedRoutes[0].html).toContain('Oh no, it\'s too late!')
  expect(renderedRoutes).toMatchSnapshot()
})

test("time's-out if event doesn't fire after 1500ms", async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      timeout: 1500,
      renderAfterDocumentEvent: 'non-existing',
    }),
  })

  await prerenderer.initialize()
  await expect(async () => {
    await prerenderer.renderRoutes(['/dynamic.html'])
  }).rejects.toThrowErrorMatchingSnapshot()
  await prerenderer.destroy()
})
