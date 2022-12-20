import IRenderer from '../../prerenderer/src/IRenderer'

const promiseLimit = require('promise-limit')
const puppeteer = require('puppeteer')

declare global {
  interface Window {
    __PRERENDER_STATUS?: {
      _DOCUMENT_EVENT_RESOLVED?: boolean
    };
  }
}

const waitForRender = function (options) {
  options = options || {}

  return new Promise<void>((resolve, reject) => {
    // Render when an event fires on the document.
    if (options.renderAfterDocumentEvent) {
      if (window.__PRERENDER_STATUS && window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED) resolve()
      document.addEventListener(options.renderAfterDocumentEvent, () => resolve())

      // Expire after 2 minutes by default
      const timeout = typeof options.timeout === 'number' ? options.timeout : 1000 * 60 * 2
      if (timeout) {
        setTimeout(() => reject(new Error(
          `Could not prerender: event '${options.renderAfterDocumentEvent}' did not occur within ${Math.round(timeout / 1000)}s`)
        ), timeout)
      }
      // Render after a certain number of milliseconds.
    } else if (options.renderAfterTime) {
      setTimeout(() => resolve(), options.renderAfterTime)

      // Default: Render immediately after page content loads.
    } else {
      resolve()
    }
  })
}

class PuppeteerRenderer implements IRenderer {
  private puppeteer = null
  private readonly rendererOptions

  constructor (rendererOptions) {
    this.rendererOptions = rendererOptions || {}

    if (this.rendererOptions.maxConcurrentRoutes == null) this.rendererOptions.maxConcurrentRoutes = 0

    if (this.rendererOptions.inject && !this.rendererOptions.injectProperty) {
      this.rendererOptions.injectProperty = '__PRERENDER_INJECTED'
    }
  }

  async initialize () {
    try {
      // Workaround for Linux SUID Sandbox issues.
      if (process.platform === 'linux') {
        if (!this.rendererOptions.args) this.rendererOptions.args = []

        if (this.rendererOptions.args.indexOf('--no-sandbox') === -1) {
          this.rendererOptions.args.push('--no-sandbox')
          this.rendererOptions.args.push('--disable-setuid-sandbox')
        }
      }

      this.puppeteer = await puppeteer.launch(this.rendererOptions)
    } catch (e) {
      console.error(e)
      console.error('[Prerenderer - PuppeteerRenderer] Unable to start Puppeteer')
      // Re-throw the error so it can be handled further up the chain. Good idea or not?
      throw e
    }

    return this.puppeteer
  }

  async handleRequestInterception (page, baseURL) {
    await page.setRequestInterception(true)

    page.on('request', req => {
      // Skip third party requests if needed.
      if (this.rendererOptions.skipThirdPartyRequests) {
        if (!req.url().startsWith(baseURL)) {
          req.abort()
          return
        }
      }

      req.continue()
    })
  }

  async renderRoutes (routes, Prerenderer) {
    const rootOptions = Prerenderer.getOptions()
    const options = this.rendererOptions

    const limiter = promiseLimit(this.rendererOptions.maxConcurrentRoutes)

    return Promise.all(
      routes.map(
        (route, index) => limiter(
          async () => {
            const page = await this.puppeteer.newPage()

            if (options.consoleHandler) {
              page.on('console', message => options.consoleHandler(route, message))
            }

            if (options.inject) {
              await page.evaluateOnNewDocument(`(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`)
            }

            const baseURL = `http://localhost:${rootOptions.server.port}`

            // Allow setting viewport widths and such.
            if (options.viewport) await page.setViewport(options.viewport)

            await this.handleRequestInterception(page, baseURL)

            // Hack just in-case the document event fires before our main listener is added.
            if (options.renderAfterDocumentEvent) {
              page.evaluateOnNewDocument(function (options) {
                window.__PRERENDER_STATUS = {}
                document.addEventListener(options.renderAfterDocumentEvent, () => {
                  window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED = true
                })
              }, this.rendererOptions)
            }

            const navigationOptions = (options.navigationOptions) ? { waituntil: 'networkidle0', ...options.navigationOptions } : { waituntil: 'networkidle0' }
            await page.goto(`${baseURL}${route}`, navigationOptions)

            // Wait for some specific element exists
            const { renderAfterElementExists } = this.rendererOptions
            if (renderAfterElementExists && typeof renderAfterElementExists === 'string') {
              await page.waitForSelector(renderAfterElementExists)
            }
            // Once this completes, it's safe to capture the page contents.
            await page.evaluate(waitForRender, this.rendererOptions)

            const result = {
              originalRoute: route,
              route: await page.evaluate('window.location.pathname'),
              html: await page.content()
            }

            await page.close()
            return result
          }
        )
      )
    )
  }

  destroy () {
    if (this.puppeteer) {
      try {
        this.puppeteer.close()
      } catch (e) {
        console.error(e)
        console.error('[Prerenderer - PuppeteerRenderer] Unable to close Puppeteer')

        throw e
      }
    }
  }
}

module.exports = PuppeteerRenderer
