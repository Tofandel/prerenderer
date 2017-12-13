const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const cheerio = require('cheerio')
const opn = require('opn')
const promiseLimit = require('promise-limit')
const EventEmitter = require('events')

const getPageContents = function (rendererOptions, rootOptions, originalRoute) {
  rendererOptions = rendererOptions || {}

  function send (result) {
    /* eslint-disable */
    // Obviously requires the fetch API.
    fetch(`http://localhost:${rootOptions.server.port}/__prerenderer-browser-route/renderer-completed`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }).then(res => {
      window.close()
    })
    /* eslint-enable */
  }

  function captureDocument () {
    const doctype = new window.XMLSerializer().serializeToString(document.doctype)
    const outerHTML = document.documentElement.outerHTML

    const result = {
      route: originalRoute,
      html: doctype + outerHTML
    }

    return result
  }

  // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
  if (rendererOptions.renderAfterDocumentEvent) {
    window.document.addEventListener(rendererOptions.renderAfterDocumentEvent, () => send(captureDocument()))

  // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
  } else if (rendererOptions.renderAfterElementExists) {
    let doc = window.document
    // TODO: Try and get something MutationObserver-based working.
    setInterval(() => {
      if (doc.querySelector(rendererOptions.renderAfterElementExists)) send(captureDocument())
    }, 100)

  // CAPTURE AFTER A NUMBER OF MILLISECONDS
  } else if (rendererOptions.renderAfterTime) {
    setTimeout(() => send(captureDocument()), rendererOptions.renderAfterTime)

  // DEFAULT: RUN IMMEDIATELY
  } else {
    send(captureDocument())
  }
}

class BrowserRenderer {
  constructor (rendererOptions) {
    this._rendererOptions = rendererOptions || {}
    this._routeEmitter = new EventEmitter()

    if (this._rendererOptions.maxConcurrentRoutes == null) this._rendererOptions.maxConcurrentRoutes = 0

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED'
    }

    if (!this._rendererOptions.injectedScriptId) {
      this._rendererOptions.injectedScriptId = '__prerenderer-browser-injected-326eaade-583d-407b-bfcc-6f56c5507a55'
    }

    if (!this._rendererOptions.opn) this._rendererOptions.opn = {}

    this._rendererOptions.opn = Object.assign({}, this._rendererOptions.opn)
  }

  addRouteListener () {}

  /**
   * Internal, dangerous, allows you to modify the server before anything is initialized.
   * You really shouldn't need this. Avoid at all costs.
   * @param {Prerenderer} Prerenderer the prerenderer instance that owns this renderer.
   * @param {ServerWrapper} ServerWrapper the wrapped internal server object.
   * @param {String} stage The stage of server initialization to modify on. See ../server.js.
   */
  modifyServer (Prerenderer, ServerWrapper, stage) {
    const rootOptions = Prerenderer.getOptions()
    const rendererOptions = this._rendererOptions

    if (stage === 'pre-fallback') {
      ServerWrapper._expressServer.get('*', (req, res, next) => {
        try {
          // TODO: May not be robust enough. I'm lazy and used readFileSync... Sorry.
          const file = fs.readFileSync(rootOptions.indexPath ? rootOptions.indexPath : path.join(rootOptions.staticDir, 'index.html'), 'utf-8')

          // Process the page with cheerio. (Hopefully won't cause things to break.)
          const $ = cheerio.load(file)

          const hasScript = $('script').length > 0

          // Separate function for injecting an object into the page.
          const injectScript = rendererOptions.inject ? `(function () { window['${rendererOptions.injectProperty}'] = ${JSON.stringify(rendererOptions.inject)}; })();` : ''

          // This handles rendering and communicating back to the server.
          const rendererScript = $(`
            <script type="text/javascript" id="${rendererOptions.injectedScriptId}">
              (function() {
                ${injectScript}

                // Remove script from the DOM before rendering anything.
                const scriptElement = window['${rendererOptions.injectedScriptId}']
                // removeNode for IE support.
                scriptElement.remove ? scriptElement.remove() : scriptElement.removeNode(true)

                const getPageContents = (${getPageContents});
                // May not be reliable...
                const originalRoute = window.location.pathname

                document.addEventListener('DOMContentLoaded', function() {
                  getPageContents(${JSON.stringify(rendererOptions)}, ${JSON.stringify(rootOptions)}, originalRoute);
                });
              })()
            </script>
          `.trim())

          // Inject before the first script element or at the end of the head element.
          if (hasScript) {
            rendererScript.insertBefore('script')
          } else {
            rendererScript.appendTo('head')
          }

          res.send($.html())
        } catch (e) {
          console.error(e)
          next()
        }
      })

      ServerWrapper._expressServer.post('/__prerenderer-browser-route/renderer-completed', bodyParser.json(), (req, res) => {
        try {
          const result = req.body

          this._routeEmitter.emit(result.route, result)
          res.sendStatus(200)
        } catch (e) {
          console.error(e)
          res.sendStatus(500)
        }
      })
    }
  }

  async initialize () {
    // NOOP
    return Promise.resolve()
  }

  async renderRoutes (routes, Prerenderer) {
    const limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes)
    const rootOptions = Prerenderer.getOptions()

    return Promise.all(routes.map(route => limiter(() => {
      return opn(`http://localhost:${rootOptions.server.port}${route}`, {wait: false, ...this._rendererOptions.opn})
          .then(cp => {
              return new Promise((resolve, reject) => {
                  this._routeEmitter.on(route, result => {
                      cp.kill()
                      resolve(result)
                  })
              })
          })
    })))
  }

  destroy () {
    // NOOP
  }
}

module.exports = BrowserRenderer
