import Prerenderer, { IRenderer } from '@prerenderer/prerenderer'
import Storage from './Storage'

import { DOMWindow, JSDOM } from 'jsdom'
import promiseLimit from 'promise-limit'
import { RendererJSDOMOptions } from './Options'

const shim = function (window: DOMWindow) {
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  window.SVGElement = window.HTMLElement
  // @ts-ignore
  window.localStorage = new Storage()
  // @ts-ignore
  window.sessionStorage = new Storage()
  /* eslint-enable */
}

const getPageContents = function (window: DOMWindow, options: RendererJSDOMOptions, originalRoute: string) {
  options = options || {}

  return new Promise((resolve, reject) => {
    let int

    function captureDocument () {
      const result = {
        originalRoute,
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

      // Expire after 2 minutes by default
      const timeout = typeof options.timeout === 'number' ? options.timeout : 1000 * 60 * 2
      if (timeout) {
        setTimeout(() => reject(new Error(
          `Could not prerender: event '${options.renderAfterDocumentEvent}' did not occur within ${Math.round(timeout / 1000)}s`)
        ), timeout)
      }
      // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      const doc = window.document
      int = setInterval(() => {
        if (doc.querySelector(options.renderAfterElementExists)) resolve(captureDocument())
      }, 100)

      // Expire after 2 minutes by default
      const timeout = typeof options.timeout === 'number' ? options.timeout : 1000 * 60 * 2
      if (timeout) {
        setTimeout(() => reject(new Error(
          `Could not prerender: element '${options.renderAfterElementExists}' not found after ${Math.round(timeout / 1000)}s`)
        ), timeout)
      }
      // CAPTURE AFTER A NUMBER OF MILLISECONDS
    } else if (options.renderAfterTime) {
      setTimeout(() => resolve(captureDocument()), options.renderAfterTime)

      // DEFAULT: RUN IMMEDIATELY
    } else {
      resolve(captureDocument())
    }
  })
}

class JSDOMRenderer implements IRenderer {
  private rendererOptions: Options

  constructor (rendererOptions: Options) {
    this.rendererOptions = rendererOptions || {}

    if (this.rendererOptions.maxConcurrentRoutes == null) this.rendererOptions.maxConcurrentRoutes = 0

    if (this.rendererOptions.inject && !this.rendererOptions.injectProperty) {
      this.rendererOptions.injectProperty = '__PRERENDER_INJECTED'
    }
  }

  async initialize () {
    // NOOP
    return Promise.resolve()
  }

  async renderRoutes (routes: Array<string>, Prerenderer: Prerenderer) {
    const rootOptions = Prerenderer.getOptions()

    const limiter = promiseLimit(this.rendererOptions.maxConcurrentRoutes)

    return Promise.all(routes.map(route => limiter(() => {
      return new Promise((resolve, reject) => {
        const dom = new JSDOM('', {
          url: `http://127.0.0.1:${rootOptions.server.port}${route}`,
          runScripts: 'dangerously',
          resources: 'usable',
          pretendToBeVisual: true,
          beforeParse: (window) => {
            // Injection / shimming must happen before we resolve with the window,
            // otherwise the page will finish loading before the injection happens.
            if (this.rendererOptions.inject) {
              window[this.rendererOptions.injectProperty] = this.rendererOptions.inject
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
          return getPageContents(window, this.rendererOptions, route)
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
