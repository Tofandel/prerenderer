const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../../renderer-jsdom')

const EXPECTED_HTML = '<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener(\'DOMContentLoaded\', () => {\n      document.body.innerHTML += \'<p>Render Output</p>\'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>'

test('renders 2 routes with index at subfolder/something-else.html', async () => {
  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML
  }, {
    originalRoute: '/route',
    route: '/route',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'subfolder/something-else.html'),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/', '/route'])
  prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})
