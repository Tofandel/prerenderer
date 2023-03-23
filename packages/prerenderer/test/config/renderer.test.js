jest.mock('@prerenderer/renderer-puppeteer')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

afterEach(() => {
  jest.restoreAllMocks()
})

test('renderer option as class', async () => {
  const prerenderer = new Prerenderer({
    staticDir: __dirname,
    renderer: Renderer,
    rendererOptions: {
      headless: true,
      foo: 'bar',
    },
  })
  await prerenderer.initialize()
  expect(Renderer).toHaveBeenNthCalledWith(1, { headless: true, foo: 'bar' })
  jest.spyOn(prerenderer.getRenderer(), 'renderRoutes').mockImplementation(() => Promise.resolve([]))
  await prerenderer.renderRoutes(['/foo'])
  expect(Renderer.mock.instances[0].renderRoutes).toHaveBeenNthCalledWith(1, ['/foo'], prerenderer)
  await prerenderer.destroy()
  expect(Renderer.mock.instances[0].destroy).toHaveBeenCalledTimes(1)
})

test('renderer option as string', async () => {
  const prerenderer = new Prerenderer({
    staticDir: __dirname,
    renderer: '@prerenderer/renderer-puppeteer',
    rendererOptions: {
      headless: false,
      foo: 'baz',
    },
  })
  await prerenderer.initialize()
  expect(Renderer).toHaveBeenNthCalledWith(1, { headless: false, foo: 'baz' })
  await prerenderer.destroy()
})
