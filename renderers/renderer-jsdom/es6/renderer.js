const JSDOM = require('jsdom/lib/old-api.js').jsdom
const serializeDocument = require('jsdom/lib/old-api.js').serializeDocument
const promiseLimit = require('promise-limit')

const shim = function (window) {
  window.SVGElement = window.HTMLElement
  window.localStorage = window.sessionStorage = {

    getItem: function (key) {
      return this[key]
    },

    setItem: function (key, value) {
      this[key] = value
    }
  }
}

const getPageContents = function (window, options, originalRoute) {
  options = options || {}

  return new Promise((resolve) => {
    let int

    function captureDocument () {
      const result = {
        originalRoute: originalRoute,
        route: originalRoute,
        html: serializeDocument(window.document)
      }

      if (int != null) {
        clearInterval(int)
      }

      window.close()
      return result
    }

    // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
    if (options.renderAfterDocumentEvent) {
      window.document.addEventListener(options.renderAfterDocumentEvent, () => resolve(captureDocument()))

    // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      let doc = window.document
      int = setInterval(() => {
        if (doc.querySelector(options.renderAfterElementExists)) resolve(captureDocument())
      }, 100)

    // CAPTURE AFTER A NUMBER OF MILLISECONDS
    } else if (options.renderAfterTime) {
      setTimeout(() => resolve(captureDocument()), options.renderAfterTime)

    // DEFAULT: RUN IMMEDIATELY
    } else {
      resolve(captureDocument())
    }
  })
}

class JSDOMRenderer {
  constructor (rendererOptions) {
    this._rendererOptions = rendererOptions || {}

    if (this._rendererOptions.maxConcurrentRoutes == null) this._rendererOptions.maxConcurrentRoutes = 0

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED'
    }
  }

  async initialize () {
    // NOOP
    return Promise.resolve()
  }

  async renderRoutes (routes, Prerenderer) {
    const rootOptions = Prerenderer.getOptions()

    const limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes)

    return Promise.all(routes.map(route => limiter(() => {
      return new Promise((resolve, reject) => {
        JSDOM.env({
          url: `http://127.0.0.1:${rootOptions.server.port}${route}`,
          features: {
            FetchExternalResources: ['script'],
            ProcessExternalResources: ['script'],
            SkipExternalResources: false
          },
          created: (err, window) => {
            if (err) return reject(err)
            // Injection / shimming must happen before we resolve with the window,
            // otherwise the page will finish loading before the injection happens.
            if (this._rendererOptions.inject) {
              window[this._rendererOptions.injectProperty] = this._rendererOptions.inject
            }

            window.addEventListener('error', function (event) {
              console.error(event.error)
            })

            shim(window)

            resolve(window)
          }
        })
      })
        .then(window => {
          return getPageContents(window, this._rendererOptions, route)
        })
    })))
      .catch(e => {
        console.error(e)
        return Promise.reject(e)
      })
  }

  destroy () {
    // NOOP
  }
}

module.exports = JSDOMRenderer
