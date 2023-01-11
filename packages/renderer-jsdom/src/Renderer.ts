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
    if (options.renderAfterTime && this.options.timeout < options.renderAfterTime) {
      this.options.timeout = options.renderAfterTime + 1000
    }
  }

  async initialize () {
    // NOOP
  }

  async renderRoutes (routes: Array<string>, prerenderer: Prerenderer) {
    const rootOptions = prerenderer.getOptions()

    const limiter = promiseLimit<RenderedRoute>(this.options.maxConcurrentRoutes)

    const host = `http://${rootOptions.server.host}:${rootOptions.server.port}`
    return Promise.all(
      routes.map(
        route => limiter(() => this.getPageContent(host, route)),
      ),
    ).catch(e => {
      console.error(e)
      return Promise.reject(e)
    })
  }

  private getPageContent (host: string, originalRoute: string) {
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
          if (this.options.inject) {
            window[this.options.injectProperty] = this.options.inject
          }

          window.addEventListener('error', function (event) {
            console.error(event.error)
          })

          const timeout = this.options.timeout

          const doc = window.document

          // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
          if (this.options.renderAfterDocumentEvent) {
            const event = this.options.renderAfterDocumentEvent
            doc.addEventListener(event, captureDocument)

            if (timeout) {
              tim = setTimeout(() => reject(new Error(
                `Could not prerender: event '${event}' did not occur within ${Math.round(timeout / 1000)}s`),
              ), timeout)
            }
            // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
          } else if (this.options.renderAfterElementExists) {
            const selector = this.options.renderAfterElementExists
            int = setInterval(() => {
              if (doc.querySelector(selector)) {
                captureDocument()
              }
            }, 50)

            if (timeout) {
              tim = setTimeout(() => reject(new Error(
                `Could not prerender: element '${selector}' not found after ${Math.round(timeout / 1000)}s`),
              ), timeout)
            }
          } else if (this.options.renderAfterTime) {
            // CAPTURE AFTER A NUMBER OF MILLISECONDS
            setTimeout(captureDocument, this.options.renderAfterTime)
          } else {
            // DEFAULT: RUN IMMEDIATELY

            if (timeout) {
              tim = setTimeout(() => reject(new Error(
                `Could not prerender: timed-out after ${Math.round(timeout / 1000)}s`),
              ), timeout)
            }

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
