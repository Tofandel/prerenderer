import { IRenderer, RenderedRoute, Prerenderer } from '@prerenderer/prerenderer'
import Storage from './Storage'

import { DOMWindow, JSDOM } from 'jsdom'
import promiseLimit from 'promise-limit'
import { defaultOptions, JSDOMRendererFinalOptions, JSDOMRendererOptions, schema } from './Options'
import { validate } from 'schema-utils'
import { Schema } from 'schema-utils/declarations/validate'
import deepMerge from 'ts-deepmerge'

// Fetch polyfill for jsdom
import { fetch, Headers, Request, Response } from 'whatwg-fetch'

const shim = function (window: DOMWindow) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment */
  // @ts-ignore
  window.SVGElement = window.HTMLElement
  // @ts-ignore
  window.localStorage = new Storage()
  // @ts-ignore
  window.sessionStorage = new Storage()
  global.XMLHttpRequest = window.XMLHttpRequest
  window.fetch = fetch
  window.Headers = Headers
  window.Request = Request
  window.Response = Response
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
    if (options.renderAfterTime && this.options.timeout < options.renderAfterTime) {
      this.options.timeout = options.renderAfterTime + 1000
    }
  }

  async initialize () {
    // NOOP
  }

  renderRoutes (routes: Array<string>, prerenderer: Prerenderer) {
    const rootOptions = prerenderer.getOptions()

    const limiter = promiseLimit<RenderedRoute>(this.options.maxConcurrentRoutes)

    const host = `http://${rootOptions.server.host}:${rootOptions.server.port}`
    return Promise.all(
      routes.map(
        route => limiter(() => this.getPageContent(host, route)),
      ),
    )
  }

  private getPageContent (host: string, originalRoute: string) {
    const options = this.options
    return new Promise<RenderedRoute>((resolve, reject) => {
      let int: NodeJS.Timer | null = null
      let tim: NodeJS.Timeout | null = null

      const captureDocument = () => {
        if (int !== null) {
          clearInterval(int)
        }
        void pr.then((dom) => {
          if (tim !== null) {
            clearTimeout(tim)
          }

          const result: RenderedRoute = {
            originalRoute,
            route: originalRoute,
            html: dom.serialize(),
          }

          dom.window.close()
          resolve(result)
        })
      }

      const pr = JSDOM.fromURL(`${host}${originalRoute}`, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        beforeParse: (window) => {
          // Injection / shimming must happen before we resolve with the window,
          // otherwise the page will finish loading before the injection happens.
          if (options.inject) {
            window[options.injectProperty] = options.inject
          }

          window.addEventListener('error', function (event) {
            console.error(event.error)
          })

          const timeout = options.timeout

          const doc = window.document

          if (timeout && !options.renderAfterTime) {
            const timeS = Math.round(timeout / 100) / 10
            tim = setTimeout(() => {
              int && clearInterval(int)

              if (options.renderAfterDocumentEvent) {
                reject(new Error(`Could not prerender: event '${options.renderAfterDocumentEvent}' did not occur within ${timeS}s`))
              } else if (options.renderAfterElementExists) {
                reject(new Error(`Could not prerender: element '${options.renderAfterElementExists}' did not appear within ${timeS}s`))
              } else {
                reject(new Error(`Could not prerender: timed-out after ${timeS}s`))
              }
            }, timeout)
          }

          if (options.renderAfterDocumentEvent) {
            // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
            const event = options.renderAfterDocumentEvent
            doc.addEventListener(event, captureDocument)
          } else if (options.renderAfterElementExists) {
            // CAPTURE ONCE A SPECIFIC ELEMENT EXISTS
            const selector = options.renderAfterElementExists
            int = setInterval(() => {
              if (doc.querySelector(selector)) {
                captureDocument()
              }
            }, 50)
          } else if (options.renderAfterTime) {
            // CAPTURE AFTER A NUMBER OF MILLISECONDS
            setTimeout(captureDocument, options.renderAfterTime)
          } else {
            // DEFAULT: RUN IMMEDIATELY
            captureDocument()
          }
          shim(window)
        },
      })
      pr.catch(reject)
    })
  }

  destroy () {
    // NOOP
  }
}
