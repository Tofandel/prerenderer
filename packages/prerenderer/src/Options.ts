import IRenderer from './IRenderer'
import { Options as ProxyOptions } from 'http-proxy-middleware'
import { Express } from 'express'
import { Schema } from 'schema-utils/declarations/validate'

export interface ServerOptions {
  port?: number
  before?(server: Express)
  proxy?: Record<string, ProxyOptions>
}

export interface Options {
  staticDir: string
  indexPath: string
  server: ServerOptions
  renderer: IRenderer
}

export const schema: Schema = {
  properties: {
    staticDir: {
      type: 'string',
      required: true
    },
    indexPath: {
      type: 'string',
      required: false
    },
    server: {
      type: 'object',
      description: 'The express server options',
      properties: {
        port: {
          type: 'number',
          description: 'The port number used by the express server'
        },
        before: {
          instanceOf: 'Function',
          description: 'A hook to run before starting the express server'
        },
        proxy: {
          type: 'object',
          additionalProperties: true,
          description: 'A list of proxy options keyed by the path of the proxy'
        }
      }
    },
    renderer: {
      type: 'object',
      description: 'The renderer class or instance to use'
    }
  }
}
