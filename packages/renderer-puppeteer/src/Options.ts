import { Schema } from 'schema-utils/declarations/validate'
import { ConsoleMessage, PuppeteerLaunchOptions, Viewport, WaitForOptions } from 'puppeteer'

export interface PuppeteerRendererOptions extends PuppeteerLaunchOptions {
  maxConcurrentRoutes?: number
  renderAfterDocumentEvent?: string
  renderAfterElementExists?: string
  renderAfterTime?: number
  timeout?: number
  inject?: unknown
  injectProperty?: string
  skipThirdPartyRequests?: boolean

  consoleHandler?(route: string, message: ConsoleMessage): void

  viewport?: Viewport
  navigationOptions?: WaitForOptions
}

export const schema: Schema = {
  additionalProperties: true,
  minProperties: 1, // There should at least be a renderAfter option
  properties: {
    headless: {
      type: 'boolean',
      default: true,
    },
    maxConcurrentRoutes: {
      type: 'number',
      default: 10,
    },
    renderAfterDocumentEvent: {
      type: 'string',
      description: 'The name of the event that should trigger the rendering of the page',
    },
    renderAfterElementExists: {
      type: 'string',
      description: 'Wait until this selector is found on the page',
    },
    renderAfterTime: {
      type: 'number',
      description: 'Time to wait for in ms before rendering the page',
    },
    timeout: {
      type: 'number',
      description: 'The time in ms after which we should stop waiting and throw an error',
      default: 12000,
    },
    injectProperty: {
      type: 'string',
      description: 'The key of the injected value into window',
    },
    inject: {
      anyOf: [
        { type: 'object' },
        { type: 'string' },
        { type: 'array' },
      ],
      description: 'The value of the injected value',
    },
    args: {
      type: 'array',
      description: 'List of CLI arguments to launch puppeteer with',
      items: {
        type: 'string',
      },
    },
    skipThirdPartyRequests: {
      type: 'boolean',
      description: 'Setting this option to true will ignore all requests to external urls',
    },
    consoleHandler: {
      instanceOf: 'Function',
      description: 'A custom handler for console messages happening on the page',
    },
    viewport: {
      type: 'object',
      additionalProperties: true, // If ever options are added
      required: ['height', 'width'],
      properties: {
        width: {
          type: 'number',
          description: 'The page width in pixels.',
        },
        height: {
          type: 'number',
          description: 'The page height in pixels.',
        },
        deviceScaleFactor: {
          type: 'number',
          description: '' +
            'Specify device scale factor. See https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio for more info.',
          default: 1,
        },
        isMobile: {
          type: 'boolean',
          description: 'Whether the `meta viewport` tag is taken into account.',
        },
        isLandscape: {
          type: 'boolean',
          description: 'Specifies if the viewport is in landscape mode.',
        },
        hasTouch: {
          type: 'boolean',
          description: 'Specify if the viewport supports touch events.',
        },
      },
    },
    navigationOptions: {
      type: 'object',
      properties: {
        timeout: {
          type: 'number',
        },
        waitUntil: {
          anyOf: [
            {
              type: 'string',
              enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
            },
            { type: 'array' },
          ],
        },
      },
    },
  },
}
