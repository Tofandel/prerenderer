import IRenderer from './IRenderer'
import { Options as ProxyOptions } from 'http-proxy-middleware'
import { Express } from 'express'
import { Schema } from 'schema-utils/declarations/validate'

interface ServerOptions {
  port?: number
  before?(server: Express)
  proxy?: Record<string, ProxyOptions>
}

export interface PrerendererOptions {
  staticDir: string
  indexPath?: string
  server?: ServerOptions
  renderer?: IRenderer
}

export const schema: Schema = {
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
    },
    server: {
      type: 'object',
      description: 'The express server options',
      properties: {
        port: {
          type: 'number',
          description: 'The port number used by the express server',
        },
        before: {
          instanceOf: 'Function',
          description: 'A hook to run before starting the express server',
        },
        proxy: {
          type: 'object',
          additionalProperties: true,
          description: 'A list of proxy options keyed by the path of the proxy',
        },
      },
    },
    renderer: {
      type: 'object',
      description: 'The renderer class or instance to use',
    },
  },
}
