const { JSDOM } = require('jsdom')

const getPageContents = function (dom, window, options) {
  options = options || {}

  return new Promise((resolve, reject) => {
    function captureDocument () {
      const result = {
        route: window.location.pathname,
        html: dom.serialize()
      }

      window.close()
      return result
    }

    // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
    if (options.renderAfterDocumentEvent) {
      window.document.addEventListener(options.renderAfterDocumentEvent, () => resolve(captureDocument()))

    // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      // TODO: Try and get something MutationObserver-based working.
      setInterval(() => {
        if (window.document.querySelector(options.renderAfterElementExists)) resolve(captureDocument())
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
    this._jsdom = null
    this._rendererOptions = rendererOptions || {}

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED'
    }
  }

  async initialize () {
    // NOOP
    return Promise.resolve()
  }

  async renderRoutes (routes, serverPort, rootOptions) {
    const results = Promise.all(routes.map(route => {
      return JSDOM.fromURL(`http://127.0.0.1:${serverPort}${route}`, {
        runScripts: 'dangerously',
        resources: 'usable'
      })
      .then(dom => {
        if (this._rendererOptions.inject) {
          dom.window.eval(`
            (function () { window['${this._rendererOptions.injectProperty}'] = ${JSON.stringify(this._rendererOptions.inject)}; })();
          `)
        }

        return new Promise((resolve, reject) => {
          dom.window.document.addEventListener('DOMContentLoaded', () => {
            resolve(getPageContents(dom, dom.window, this._rendererOptions))
          })
        })
      })
    }))
    .catch(e => {
      console.error(e)
    })

    return results
  }

  destroy () {
    // NOOP
  }
}

module.exports = JSDOMRenderer
