jest.mock('@prerenderer/renderer-puppeteer')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')
afterEach(() => {
  jest.restoreAllMocks()
})

test('postProcess', async () => {
  const postProcess = jest.fn((route) => {
    if (route.route === '/exclude') {
      route.html = null
    } else {
      route.html = 'bar'
    }
  })
  const prerenderer = new Prerenderer({
    staticDir: __dirname,
    renderer: Renderer,
    postProcess,
  })
  await prerenderer.initialize()
  expect(postProcess).not.toHaveBeenCalled()
  const expectedRoute1 = {
    route: '/foo',
    originalRoute: '/foo',
    html: 'foo',
  }
  const expectedRoute2 = {
    route: '/exclude',
    originalRoute: '/exclude',
    html: 'exclude',
  }
  jest.spyOn(prerenderer.getRenderer(), 'renderRoutes').mockImplementation(() => Promise.resolve([expectedRoute1, expectedRoute2]))
  const res = await prerenderer.renderRoutes(['/foo', '/exclude'])
  await prerenderer.destroy()
  expect(postProcess).toHaveBeenCalledTimes(2)
  expect(postProcess).toHaveBeenNthCalledWith(1, expectedRoute1)
  expect(postProcess).toHaveBeenNthCalledWith(2, expectedRoute2)
  expect(res).toStrictEqual([{
    route: '/foo',
    originalRoute: '/foo',
    html: 'bar',
  }])
})
