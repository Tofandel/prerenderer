const path = require('path')
const Prerenderer = require('@prerenderer/prerenderer')
const Renderer = require('@prerenderer/renderer-jsdom')
const Chance = require('chance')
const fs = require('fs')
const chance = new Chance()

const testDir = path.resolve(__dirname, '../../../tests/basic')

const snap = fs.readFileSync(path.join(testDir, 'index.snap.html')).toString().trim()

function generateRandomRoute () {
  // Builds a "route" out of 1 - 100 path segments made of random strings.
  return '/' + new Array(chance.integer({ min: 1, max: 100 }))
    .fill('')
    .map(() => encodeURIComponent(chance.string()))
    .join('/')
}

test('renders 1 route', async () => {
  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()

  expect(renderedRoutes).toEqual([{
    route: '/',
    originalRoute: '/',
    html: snap,
  }])
})

test('renders 50 routes', async () => {
  const routes = new Array(50).fill('').map(() => generateRandomRoute())

  const prerenderer = new Prerenderer({
    staticDir: testDir,
    renderer: new Renderer(),
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(routes)
  await prerenderer.destroy()

  renderedRoutes.forEach((renderedRoute, i) => {
    expect(renderedRoute.route).toEqual(decodeURIComponent(routes[i]))
    expect(renderedRoute.originalRoute).toEqual(routes[i])
    expect(renderedRoute.html).toEqual(snap)
  })
}, 10000)
