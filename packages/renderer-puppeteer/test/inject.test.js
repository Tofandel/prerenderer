const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

const testDir = path.resolve(__dirname, '../../../tests/inject')

test("injects {foo: 'bar'} into window['__PRERENDER_INJECTED']", async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: 'inject-basic.html',
    renderer: new Renderer({
      inject: {
        foo: 'bar',
      },
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})

test("injects {foo: 'bar'} into window['__CUSTOM_INJECTED']", async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    indexPath: 'inject-change-property.html',
    renderer: new Renderer({
      injectProperty: '__CUSTOM_INJECTED',
      inject: {
        foo: 'bar',
      },
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toMatchSnapshot()
})
