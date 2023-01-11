const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')
const Chance = require('chance')
const chance = new Chance()

function generateRandomRoute () {
  // Builds a "route" out of 1 - 100 path segments made of random strings.
  return '/' + new Array(chance.integer({ min: 1, max: 100 }))
    .fill('')
    .map(() => encodeURIComponent(chance.string()))
    .join('/')
}

test('renders 50 routes', async () => {
  const routes = new Array(50).fill('').map(() => generateRandomRoute())

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(routes)
  await prerenderer.destroy()

  renderedRoutes.forEach((renderedRoute, i) => {
    expect(renderedRoute.route).toEqual(decodeURIComponent(routes[i]))
    expect(renderedRoute.originalRoute).toEqual(routes[i])
    expect(renderedRoute.html).toMatchSnapshot('expected_html')
  })
}, 10000)
