import IRenderer, { RenderedRoute } from './IRenderer'
import { Options as ProxyOptions } from 'http-proxy-middleware'
import { Express } from 'express'
// import { JSONSchemaType } from 'ajv'
import { Schema } from 'schema-utils/declarations/validate'
import { JSONSchemaType } from 'ajv'

interface ServerOptions {
  port?: number
  host?: string
  listenHost?: string
  /**
   * @deprecated Use Prerenderer
   */
  before?(server: Express)

  proxy?: Record<string, ProxyOptions>
}

export const defaultOptions = {
  indexPath: 'index.html',
  server: {
    host: '127.0.0.1',
    listenHost: '127.0.0.1',
    port: 0,
  },
  renderer: '@prerenderer/renderer-puppeteer',
  rendererOptions: {
    headless: true,
  },
}

export type rendererOptions = Record<string, unknown>

export interface PrerendererOptions {
  staticDir: string
  indexPath?: string
  server?: ServerOptions
  renderer?: string | IRenderer | { new(options?: rendererOptions): IRenderer }
  rendererOptions?: rendererOptions
  postProcess?(route: RenderedRoute, routes: RenderedRoute[]): Promise<void> | void
}

export type PrerendererFinalOptions = PrerendererOptions & typeof defaultOptions

// AVJ's typing is very buggy, so use a looser type for what doesn't work
export const schema: JSONSchemaType<Omit<PrerendererOptions, 'server' | 'renderer' | 'postProcess'>>
  & Schema = {
    type: 'object',
    required: ['staticDir'],
    properties: {
      staticDir: {
        type: 'string',
        description: 'The root path to serve your app from.',
      },
      indexPath: {
        type: 'string',
        description: 'The index file to fall back on for SPAs.',
        default: 'index.html',
        nullable: true,
      },
      server: {
        type: 'object',
        description: 'The express server options',
        nullable: true,
        properties: {
          port: {
            type: 'number',
            description: 'The port number used by the express server',
            nullable: true,
          },
          host: {
            type: 'string',
            description: 'The host to send requests to. Use with caution, as changing this could result in external urls being rendered instead of your local server',
            default: '127.0.0.1',
            nullable: true,
          },
          listenHost: {
            type: 'string',
            description: 'The ip address the server will listen to. (0.0.0.0 would allow external access, use with caution)',
            default: '127.0.0.1',
            nullable: true,
          },
          before: {
            instanceOf: 'Function',
            description: 'A hook to run before starting the express server',
          },
          proxy: {
            type: 'object',
            required: [],
            additionalProperties: true,
            description: 'A list of proxy options keyed by the path of the proxy',
            nullable: true,
          },
        },
      },
      renderer: {
        description: 'The renderer to use (eg: @prerenderer/renderer-puppeteer or @prerenderer/renderer-jsdom)',
        anyOf: [
          {
            type: 'string',
          },
          {
            instanceof: 'Function',
          },
          {
            type: 'object',
            additionalProperties: true,
          },
        ],
      },
      rendererOptions: {
        type: 'object',
        description: 'The options to pass to the renderer if you didn\'t pass an instance of a renderer to the `renderer` option',
        additionalProperties: true,
        nullable: true,
      },
      postProcess: {
        description: 'If you want to modify the resulting html (like changing the url), you can do so in this hook, you can also add rendered routes using the second parameter',
        instanceOf: 'Function',
      },
    },
  }
