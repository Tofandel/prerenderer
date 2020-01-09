const jsdom = require('jsdom')
const { JSDOM } = jsdom
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

const getPageContents = function (dom, options, originalRoute) {
  options = options || {}
  let timeout
  return new Promise((resolve, reject) => {
    let int

    function captureDocument () {
      const result = {
        originalRoute: originalRoute,
        route: originalRoute,
        html: dom.serialize()
      }

      if (int != null) {
        clearInterval(int)
      }

      clearTimeout(timeout)

      dom.window.close()
      return result
    }

    if (options.timeout) {
      timeout = setTimeout(() => {
        console.log(originalRoute, 'timed out waiting to capture')
        dom.window.close()
        resolve({
          originalRoute: originalRoute,
          route: originalRoute,
          html: ''
        })
      }, options.timeout)
    }

    // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
    if (options.renderAfterDocumentEvent) {
      dom.window.document.addEventListener(options.renderAfterDocumentEvent, () => resolve(captureDocument()))
      // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      let doc = dom.window.document
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

    const _rendererOptions = this._rendererOptions
    const limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes)

    const results = Promise.all(routes.map(route => limiter(() => {
      const vconsole = new jsdom.VirtualConsole()
      // vconsole.sendTo(console, {omitJSDOMErrors: true})

      return JSDOM.fromURL(`http://127.0.0.1:${rootOptions.server.port}${route}`, {
        resources: 'usable',
        runScripts: 'dangerously',
        virtualConsole: vconsole,
        beforeParse (window) {
          // Injection / shimming must happen before we resolve with the window,
          // otherwise the page will finish loading before the injection happens.
          if (_rendererOptions.inject) {
            window[_rendererOptions.injectProperty] = _rendererOptions.inject
          }
        }
      })
    })
      .then(dom => {
        return getPageContents(dom, _rendererOptions, route)
      })
      .catch(e => {
        console.error('caught error', e)
        return Promise.reject(e)
      })))

    return results
  }

  destroy () {
    // NOOP
  }
}

module.exports = JSDOMRenderer
