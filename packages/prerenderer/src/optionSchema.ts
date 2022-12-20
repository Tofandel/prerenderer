import IRenderer from './IRenderer'
import { Options as ProxyOptions } from 'http-proxy-middleware'
import { Express } from 'express'

export type Options = {
  staticDir: string,
  indexPath: string,
  server: {
    port?: number,
    before?(server: Express),
    proxy?: Record<string, ProxyOptions>
  },
  renderer: IRenderer
}

export default {
  staticDir: {
    type: String,
    required: true
  },
  indexPath: {
    type: String,
    required: false
  }
}
