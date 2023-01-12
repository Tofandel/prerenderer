import express from 'express'

import path from 'path'
import Prerenderer from './Prerenderer'
import { PrerendererFinalOptions } from './PrerendererOptions'
import { Server as HttpServer } from 'http'

export type Stage = 'pre-static' | 'post-static' | 'pre-fallback' | 'post-fallback'

export default class Server {
  private prerenderer: Prerenderer
  private options: PrerendererFinalOptions
  private readonly expressServer: ReturnType<typeof express>
  private nativeServer: HttpServer | null = null

  constructor (prerenderer: Prerenderer) {
    this.prerenderer = prerenderer
    this.expressServer = express()
    this.options = prerenderer.getOptions()
  }

  public getExpressServer () {
    return this.expressServer
  }

  async initialize () {
    const server = this.expressServer

    if (this.options.server && this.options.server.before) {
      this.options.server.before(server)
    }

    this.prerenderer.modifyServer('pre-static')

    if (this.options.server && this.options.server.proxy) {
      const proxy = this.options.server.proxy // Avoid possible external mutation to undefined
      await import('http-proxy-middleware').then(({ createProxyMiddleware }) => {
        Object.keys(proxy).forEach((proxyPath) =>
          server.use(proxyPath, createProxyMiddleware({ logLevel: 'warn', ...proxy[proxyPath] })))
      }).catch(() => {
        throw new Error('The http-proxy-middleware module could not be loaded, did you install it?')
      })
    }

    server.get('*', express.static(this.options.staticDir, {
      dotfiles: 'allow',
    }))

    this.prerenderer.modifyServer('post-static')

    this.prerenderer.modifyServer('pre-fallback')

    server.get('*', (req, res) => {
      res.sendFile(this.options.indexPath ? path.resolve(this.options.staticDir, this.options.indexPath) : path.join(this.options.staticDir, 'index.html'))
    })

    this.prerenderer.modifyServer('post-fallback')

    await new Promise<void>((resolve) => {
      this.nativeServer = server.listen(this.options.server.port, this.options.server.listenHost, () => {
        resolve()
      })
    })
  }

  destroy () {
    return new Promise<void>(resolve => {
      this.nativeServer?.close(() => resolve())
    })
  }
}
