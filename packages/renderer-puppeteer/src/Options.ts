import { ConsoleMessage, Page, PuppeteerLaunchOptions, Viewport, WaitForOptions } from 'puppeteer'
import { JSONSchemaType } from 'ajv'
import { Schema } from 'schema-utils/declarations/validate'

export interface PuppeteerRendererOptions {
  maxConcurrentRoutes?: number
  renderAfterDocumentEvent?: string
  renderAfterElementExists?: string
  renderAfterTime?: number
  timeout?: number
  inject?: unknown
  injectProperty?: string
  skipThirdPartyRequests?: boolean
  headless?: boolean
  args?: string[]

  pageSetup?: (page: Page, route: string) => void | Promise<void>
  pageHandler?: (page: Page, route: string) => void | Promise<void>

  consoleHandler?: (route: string, message: ConsoleMessage) => void

  viewport?: Viewport
  launchOptions?: PuppeteerLaunchOptions
  navigationOptions?: WaitForOptions

  elementVisible?: boolean
  elementHidden?: boolean
}

export const defaultOptions = {
  headless: true,
  injectProperty: '__PRERENDER_INJECTED',
  maxConcurrentRoutes: 0,
  timeout: 1000 * 30, // 30 sec timeout by default
}

export type PuppeteerRendererFinalOptions = PuppeteerRendererOptions & typeof defaultOptions

export const schema: JSONSchemaType<Omit<PuppeteerRendererOptions, 'inject' | 'pageHandler' | 'pageSetup' | 'consoleHandler' | 'navigationOptions'>>
  & Schema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      launchOptions: {
        type: 'object',
        additionalProperties: true,
        nullable: true,
      },
      headless: {
        type: 'boolean',
        description: 'Set to true if you want to the browser to open when rendering',
        nullable: true,
      },
      maxConcurrentRoutes: {
        type: 'number',
        nullable: true,
      },
      renderAfterDocumentEvent: {
        type: 'string',
        description: 'The name of the event that should trigger the rendering of the page',
        nullable: true,
      },
      renderAfterElementExists: {
        type: 'string',
        description: 'Wait until this selector is found on the page',
        nullable: true,
      },
      elementVisible: {
        type: 'boolean',
        nullable: true,
        description: 'If this is true, the renderAfterElementExists must be visible on the page to trigger the render',
      },
      elementHidden: {
        type: 'boolean',
        nullable: true,
        description: 'If this is false, the renderAfterElementExists must be hidden on the page to trigger the render',
      },
      renderAfterTime: {
        type: 'number',
        description: 'Time to wait for in ms before rendering the page',
        nullable: true,
      },
      timeout: {
        type: 'number',
        description: 'The time in ms after which we should stop waiting and throw an error',
        nullable: true,
      },
      injectProperty: {
        type: 'string',
        description: 'The key of the injected value into window',
        nullable: true,
      },
      args: {
        type: 'array',
        description: 'List of CLI arguments to launch puppeteer with',
        items: {
          type: 'string',
        },
        nullable: true,
      },
      pageHandler: {
        instanceOf: 'Function',
        description: 'A custom handler to use the puppeteer api when opening the page',
      },
      pageSetup: {
        instanceOf: 'Function',
        description: 'A custom handler that can be used to register interceptors on the page',
      },
      skipThirdPartyRequests: {
        type: 'boolean',
        description: 'Setting this option to true will ignore all requests to external urls',
        nullable: true,
      },
      consoleHandler: {
        instanceOf: 'Function',
        description: 'A custom handler for console messages happening on the page',
      },
      viewport: {
        type: 'object',
        additionalProperties: true, // If ever options are added
        required: ['height', 'width'],
        nullable: true,
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
            description: 'Specify device scale factor. See https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio for more info.',
            nullable: true,
          },
          isMobile: {
            type: 'boolean',
            description: 'Whether the `meta viewport` tag is taken into account.',
            nullable: true,
          },
          isLandscape: {
            type: 'boolean',
            description: 'Specifies if the viewport is in landscape mode.',
            nullable: true,
          },
          hasTouch: {
            type: 'boolean',
            description: 'Specify if the viewport supports touch events.',
            nullable: true,
          },
        },
      },
      navigationOptions: {
        type: 'object',
        nullable: true,
        properties: {
          timeout: {
            type: 'number',
            nullable: true,
          },
          waitUntil: {
            type: 'null',
            nullable: true,
            anyOf: [
              {
                type: 'string',
                enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
                },
              },
            ],
          },
        },
      },
    },
  }
