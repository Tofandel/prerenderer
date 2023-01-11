import { IRenderer, RenderedRoute, Prerenderer } from '@prerenderer/prerenderer'
import Storage from './Storage'

import { DOMWindow, JSDOM } from 'jsdom'
import promiseLimit from 'promise-limit'
import { defaultOptions, JSDOMRendererFinalOptions, JSDOMRendererOptions, schema } from './Options'
import { validate } from 'schema-utils'
import { Schema } from 'schema-utils/declarations/validate'
import deepMerge from 'ts-deepmerge'

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

export default class JSDOMRenderer implements IRenderer {
  private options: JSDOMRendererFinalOptions

  constructor (options: JSDOMRendererOptions = {}) {
    validate(schema as Schema, options, {
      name: 'Renderer JSDOM',
      baseDataPath: 'options',
    })
    this.options = deepMerge(defaultOptions, options) as JSDOMRendererFinalOptions
  }

  async initialize () {
    // NOOP
  }

  async renderRoutes (routes: Array<string>, prerenderer: Prerenderer) {
    const rootOptions = prerenderer.getOptions()

    const limiter = promiseLimit<RenderedRoute>(this.options.maxConcurrentRoutes)

    const host = `http://${rootOptions.server.host}:${rootOptions.server.port}`
    return Promise.all(routes.map(route => limiter(() => {
      const dom = new JSDOM('', {
        url: `http://${host}${route}`,
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        beforeParse: (window) => {
          // Injection / shimming must happen before we resolve with the window,
          // otherwise the page will finish loading before the injection happens.
          if (this.options.inject) {
            window[this.options.injectProperty] = this.options.inject
          }

          window.addEventListener('error', function (event) {
            console.error(event.error)
          })

          shim(window)
        },
      })

      return this.getPageContents(dom, route)
    })))
      .catch(e => {
        console.error(e)
        return Promise.reject(e)
      })
  }

  getPageContents (dom: JSDOM, originalRoute: string) {
    return new Promise<RenderedRoute>((resolve, reject) => {
      let int: NodeJS.Timer

      const captureDocument = () => {
        const result: RenderedRoute = {
          originalRoute,
          route: originalRoute,
          html: dom.serialize(),
        }

        if (int != null) {
          clearInterval(int)
        }

        dom.window.close()
        resolve(result)
      }

      // Expire after 2 minutes by default
      const timeout = this.options.timeout

      // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
      if (this.options.renderAfterDocumentEvent) {
        const event = this.options.renderAfterDocumentEvent
        window.document.addEventListener(event, captureDocument)

        if (timeout) {
          setTimeout(() => reject(new Error(
            `Could not prerender: event '${event}' did not occur within ${Math.round(timeout / 1000)}s`),
          ), timeout)
        }
        // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
      } else if (this.options.renderAfterElementExists) {
        const selector = this.options.renderAfterElementExists
        const doc = window.document
        int = setInterval(() => {
          if (doc.querySelector(selector)) {
            captureDocument()
          }
        }, 100)

        if (timeout) {
          setTimeout(() => reject(new Error(
            `Could not prerender: element '${selector}' not found after ${Math.round(timeout / 1000)}s`),
          ), timeout)
        }
        // CAPTURE AFTER A NUMBER OF MILLISECONDS
      } else if (this.options.renderAfterTime) {
        setTimeout(captureDocument, this.options.renderAfterTime)

        // DEFAULT: RUN IMMEDIATELY
      } else {
        captureDocument()
      }
    })
  }

  destroy () {
    // NOOP
  }
}
