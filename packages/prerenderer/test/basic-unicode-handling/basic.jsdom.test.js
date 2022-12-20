const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../../renderer-jsdom')

const EXPECTED_HTML = '<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener(\'DOMContentLoaded\', () => {\n      document.body.innerHTML += \'<p>Render Output</p>\'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>'

test('renders 1 route', async () => {
  const expectedResult = [{
    originalRoute: '/tést.html',
    route: '/tést.html',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/tést.html'])
  console.log(renderedRoutes)
  prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})
