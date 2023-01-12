import Prerenderer, { IRenderer, RenderedRoute } from '@prerenderer/prerenderer'

import promiseLimit from 'promise-limit'
import puppeteer, { Browser, Page } from 'puppeteer'
import { PuppeteerRendererFinalOptions, PuppeteerRendererOptions, schema, defaultOptions } from './Options'
import { waitForRender, listenForRender } from './waitForRender'
import { validate } from 'schema-utils'
import { Schema } from 'schema-utils/declarations/validate'
import deepMerge from 'ts-deepmerge'

export default class PuppeteerRenderer implements IRenderer {
  private puppeteer: Browser
  private readonly options: PuppeteerRendererFinalOptions

  constructor (options: PuppeteerRendererOptions = {}) {
    validate(schema as Schema, options, {
      name: 'Renderer Puppeteer',
      baseDataPath: 'options',
    })

    this.options = deepMerge(defaultOptions, options) as PuppeteerRendererFinalOptions

    if (options.renderAfterTime && this.options.timeout < options.renderAfterTime) {
      this.options.timeout = options.renderAfterTime + 1000
    }
  }

  async initialize () {
    // Workaround for Linux SUID Sandbox issues.
    if (process.platform === 'linux') {
      if (!this.options.args) this.options.args = []

      if (this.options.args.indexOf('--no-sandbox') === -1) {
        this.options.args.push('--no-sandbox')
        this.options.args.push('--disable-setuid-sandbox')
      }
    }

    // Puppeteer tends to stay alive if the program exits unexpectedly, try to handle this and cleanup
    const cleanup = () => void this.destroy()
    process.on('SIGTERM', cleanup)
    process.on('SIGINT', cleanup)

    process.on('uncaughtException', cleanup)

    // Is it a good idea to pass the whole option list there?
    this.puppeteer = await puppeteer.launch(this.options)
  }

  async handleRequestInterception (page: Page, baseURL: string) {
    await page.setRequestInterception(true)

    page.on('request', (req) => {
      // Skip third party requests if needed.
      if (this.options.skipThirdPartyRequests) {
        if (!req.url().startsWith(baseURL)) {
          void req.abort()
          return
        }
      }

      void req.continue()
    })
  }

  renderRoutes (routes: Array<string>, prerenderer: Prerenderer) {
    const rootOptions = prerenderer.getOptions()

    const baseURL = `http://${rootOptions.server.host}:${rootOptions.server.port}`

    const limiter = promiseLimit<RenderedRoute>(this.options.maxConcurrentRoutes)

    return Promise.all(
      routes.map(
        (route) => limiter(() => this.getPageContent(baseURL, route)),
      ),
    )
  }

  private async getPageContent (baseURL: string, route: string) {
    const options = this.options

    const page = await this.puppeteer.newPage()
    try {
      if (options.consoleHandler) {
        const handler = options.consoleHandler
        page.on('console', message => handler(route, message))
      }

      if (options.inject) {
        await page.evaluateOnNewDocument(`(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`)
      }

      // Allow setting viewport widths and such.
      if (options.viewport) await page.setViewport(options.viewport)

      await this.handleRequestInterception(page, baseURL)

      // Hack just in-case the document event fires before our main listener is added.
      if (options.renderAfterDocumentEvent) {
        await page.evaluateOnNewDocument(listenForRender, options)
      }

      const navigationOptions = {
        waituntil: 'networkidle0',
        timeout: options.timeout,
        ...options.navigationOptions,
      }
      await page.goto(`${baseURL}${route}`, navigationOptions)

      // Wait for some specific element exists
      if (options.renderAfterElementExists) {
        try {
          await page.waitForSelector(options.renderAfterElementExists, { timeout: options.timeout })
        } catch (e) {
          await page.close()
          const timeS = Math.round(options.timeout / 100) / 10
          throw new Error(`Could not prerender: element '${options.renderAfterElementExists}' did not appear within ${timeS}s`)
        }
      }

      // Once this completes, it's safe to capture the page contents.
      const res = await page.evaluate(waitForRender, options)
      if (res) {
        throw new Error(res)
      }

      const result: RenderedRoute = {
        originalRoute: route,
        route: await page.evaluate('window.location.pathname') as string,
        html: await page.content(),
      }
      return result
    } finally {
      await page.close()
    }
  }

  async destroy () {
    if (this.puppeteer) {
      await this.puppeteer.close()
    }
  }
}