const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

const testDir = path.resolve(__dirname, '../../../tests/dynamic')

test('renders after #test-element is created, before should-already-be-rendered is dispatched', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterElementExists: '#test-element',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toContain('Render Output')
  expect(renderedRoutes[0].html).not.toContain('Oh no, it\'s too late!')
  expect(renderedRoutes).toMatchSnapshot()
})

test('renders after after #late-element exists', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterElementExists: '#late-element',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).not.toContain('Render Output')
  expect(renderedRoutes[0].html).toContain('Oh no, it\'s too late!')
  expect(renderedRoutes).toMatchSnapshot()
})

test("time's-out if element doesn't exists after 2000ms", async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      timeout: 2000,
      renderAfterElementExists: '#non-existing',
    }),
  })

  await prerenderer.initialize()
  await expect(async () => {
    await prerenderer.renderRoutes(['/dynamic.html'])
  }).rejects.toThrowErrorMatchingSnapshot()
  await prerenderer.destroy()
})
