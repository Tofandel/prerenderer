const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../renderers/renderer-jsdom')
const Chance = require('chance')
const chance = new Chance()

const EXPECTED_HTML = '<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener(\'DOMContentLoaded\', () => {\n      document.body.innerHTML += \'<p>Render Output</p>\'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>'

function generateRandomRoute () {
  // Builds a "route" out of 1 - 100 path segments made of random strings.
  return '/' + new Array(chance.integer({min: 1, max: 100}))
  .fill()
  .map(item => encodeURIComponent(chance.string()))
  .join('/')
}

test('renders 1 route', async () => {
  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})

test.only('renders 10 routes', async () => {
  const routes = new Array(10).fill().map(i => generateRandomRoute())

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(routes)
  await prerenderer.destroy()

  renderedRoutes.forEach((renderedRoute, i) => {
    expect(renderedRoute.route).toEqual(decodeURIComponent(routes[i]))
    expect(renderedRoute.originalRoute).toEqual(routes[i])
    expect(renderedRoute.html).toEqual(EXPECTED_HTML)
  })
})

test('renders 1000 routes', async () => {
  const routes = new Array(1000).fill().map(i => generateRandomRoute())

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(routes)
  await prerenderer.destroy()

  renderedRoutes.forEach((renderedRoute, i) => {
    expect(renderedRoute.route).toEqual(decodeURIComponent(routes[i]))
    expect(renderedRoute.originalRoute).toEqual(routes[i])
    expect(renderedRoute.html).toEqual(EXPECTED_HTML)
  })
}, 100000)
