import { IRenderer, RenderedRoute, Prerenderer } from '@prerenderer/prerenderer'
import Storage from './Storage'

import { DOMWindow } from 'jsdom'
import promiseLimit from 'promise-limit'
import { defaultOptions, JSDOMRendererFinalOptions, JSDOMRendererOptions, schema } from './Options'
import { validate } from 'schema-utils'
import deepMerge from 'ts-deepmerge'

// Fetch polyfill for jsdom
import * as fs from 'fs'

const shim = function (window: DOMWindow) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment */
  // @ts-ignore
  !window.SVGElement && (window.SVGElement = window.HTMLElement)
  // @ts-ignore
  !window.localStorage && (window.localStorage = new Storage())
  // @ts-ignore
  !window.sessionStorage && (window.sessionStorage = new Storage())
  /* eslint-enable */

  const fetchPkg = require.resolve('whatwg-fetch/dist/fetch.umd.js')
  window.eval(fs.readFileSync(fetchPkg, 'utf-8'))
}

export default class JSDOMRenderer implements IRenderer {
  private readonly options: JSDOMRendererFinalOptions

  constructor (options: JSDOMRendererOptions = {}) {
    validate(schema, options, {
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
      let int: NodeJS.Timeout | null = null
      let tim: NodeJS.Timeout | null = null
      import('jsdom').then(({ JSDOM }) => {
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
          ...options.JSDOMOptions,
          beforeParse: (window) => {
            if (options.JSDOMOptions?.beforeParse) {
              options.JSDOMOptions.beforeParse(window)
            }
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

            let fallback = true
            // Make all options `or`, the fastest to happen will trigger the rendering
            if (options.renderAfterDocumentEvent) {
              fallback = false
              // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
              const event = options.renderAfterDocumentEvent
              doc.addEventListener(event, captureDocument)
            }
            if (options.renderAfterElementExists) {
              fallback = false
              // CAPTURE ONCE A SPECIFIC ELEMENT EXISTS
              const selector = options.renderAfterElementExists
              int = setInterval(() => {
                if (doc.querySelector(selector)) {
                  captureDocument()
                }
              }, 50)
            }
            if (options.renderAfterTime) {
              fallback = false
              // CAPTURE AFTER A NUMBER OF MILLISECONDS
              setTimeout(captureDocument, options.renderAfterTime)
            }
            if (fallback) {
            // DEFAULT: RUN IMMEDIATELY
              doc.addEventListener('DOMContentLoaded', captureDocument)
            }
            shim(window)
          },
        })
        pr.catch(reject)
      }).catch(reject)
    })
  }

  destroy () {
    // NOOP
  }
}
