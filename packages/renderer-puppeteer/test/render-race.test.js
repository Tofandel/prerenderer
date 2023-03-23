const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

const testDir = path.resolve(__dirname, '../../../tests/dynamic')

test('renders after 600ms or if #late-element exists in a race', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterTime: 600,
      renderAfterElementExists: '#late-element',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).toContain('Render Output')
  expect(renderedRoutes[0].html).not.toContain('Oh no, it\'s too late!')
})

test('renders after 1500ms or if #late-element exists in a race', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer({
      renderAfterTime: 1500, // Puppeteer is a bit slow, so give it a good second of race
      renderAfterElementExists: '#late-element',
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/dynamic.html'])
  await prerenderer.destroy()
  expect(renderedRoutes[0].html).not.toContain('Render Output')
  expect(renderedRoutes[0].html).not.toContain('Now that\'s really late')
  expect(renderedRoutes[0].html).toContain('Oh no, it\'s too late!')
})
