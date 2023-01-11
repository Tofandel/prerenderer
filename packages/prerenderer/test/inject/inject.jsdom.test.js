const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')

test("injects {foo: 'bar'} into window['__PRERENDER_INJECTED']", async () => {
  const EXPECTED_HTML =
`<!DOCTYPE html><html><head>
  <title>Prerenderer Test</title>
</head>
<body>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML += \`<p>\${JSON.stringify(window['__PRERENDER_INJECTED'])}</p>\`
    })
  </script>


<p>{"foo":"bar"}</p></body></html>`

  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML,
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'inject-basic.html'),
    renderer: new Renderer({
      renderAfterTime: 500,
      inject: {
        foo: 'bar',
      },
    }),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})

test("injects {foo: 'bar'} into window['__CUSTOM_INJECTED']", async () => {
  const EXPECTED_HTML =
`<!DOCTYPE html><html><head>
  <title>Prerenderer Test</title>
</head>
<body>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML += \`<p>\${JSON.stringify(window['__CUSTOM_INJECTED'])}</p>\`
    })
  </script>


<p>{"foo":"bar"}</p></body></html>`

  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML,
  }]

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
  expect(renderedRoutes).toEqual(expectedResult)
})
