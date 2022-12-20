const path = require('path')
const Prerenderer = require('../../')
const Renderer = require('../../../renderer-jsdom')

const EXPECTED_HTML = '<!DOCTYPE html><html><head>\n  <title>Prerenderer Test</title>\n</head>\n<body>\n  <script>\n    document.addEventListener(\'DOMContentLoaded\', () => {\n      setTimeout(() => {\n        document.body.innerHTML += \'<p>Render Output</p>\'\n        document.dispatchEvent(new Event(\'please-render\'))\n      }, 2000)\n\n      setTimeout(() => {\n        document.body.innerHTML += `<p>Oh no, it\'s too late!</p>`\n        document.dispatchEvent(new Event(\'should-already-be-rendered\'))\n      }, 3000)\n    })\n  </script>\n\n\n<p>Render Output</p></body></html>'

test('renders after please-render is dispatched, before should-already-be-rendered is dispatched', async () => {
  const expectedResult = [{
    originalRoute: '/',
    route: '/',
    html: EXPECTED_HTML
  }]

  const prerenderer = new Prerenderer({
    staticDir: path.resolve(__dirname),
    renderer: new Renderer({
      renderAfterDocumentEvent: 'please-render'
    })
  })

  await prerenderer.initialize()
  const renderedRoutes = await prerenderer.renderRoutes(['/'])
  prerenderer.destroy()
  expect(renderedRoutes).toEqual(expectedResult)
})
