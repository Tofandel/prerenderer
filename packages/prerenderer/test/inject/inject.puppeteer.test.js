const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-puppeteer')

test("injects {foo: 'bar'} into window['__PRERENDER_INJECTED']", async () => {
  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'inject-basic.html'),
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
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'inject-change-property.html'),
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
