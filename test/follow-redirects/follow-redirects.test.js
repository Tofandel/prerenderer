const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../renderers/renderer-puppeteer')

test('changes the route property when history.pushState is used to change the page URL', async () => {
  const EXPECTED_HTML = `<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener('DOMContentLoaded', () => {\n      history.pushState({}, '', '/nested/test')\n      document.body.innerHTML += '<p>Render Output</p>'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>`
  const expectedResult = [{
    originalRoute: '/',
    route: '/nested/test',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'push-state.html'),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})

test('changes the route property when history.replaceState is used to change the page URL', async () => {
  const EXPECTED_HTML = `<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener('DOMContentLoaded', () => {\n      history.replaceState({}, '', '/nested/test')\n      document.body.innerHTML += '<p>Render Output</p>'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>`
  const expectedResult = [{
    originalRoute: '/',
    route: '/nested/test',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'replace-state.html'),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})

test('mtaintains the correct route value when history.pushState is followed by history.back', async () => {
  const EXPECTED_HTML = `<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener('DOMContentLoaded', () => {\n      history.pushState({}, '', '/nested/test')\n      history.back()\n      document.body.innerHTML += '<p>Render Output</p>'\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>`
  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    indexPath: path.resolve(__dirname, 'push-state-back.html'),
    renderer: new Renderer()
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  await prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})
