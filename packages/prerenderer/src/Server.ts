import express from 'express'

import path from 'path'
import Prerenderer from './Prerenderer'
import { PrerendererOptions } from './PrerendererOptions'
import { Server as HttpServer } from 'http'

export default class Server {
  private prerenderer: Prerenderer
  private options: PrerendererOptions
  private expressServer = express()
  private nativeServer: HttpServer = null

  constructor (prerenderer: Prerenderer) {
    this.prerenderer = prerenderer
    this.options = prerenderer.getOptions()
  }

  initialize () {
    const server = this.expressServer

    if (this.options.server && this.options.server.before) {
      this.options.server.before(server)
    }

    this.prerenderer.modifyServer('pre-static')

    server.get('*', express.static(this.options.staticDir, {
      dotfiles: 'allow',
    }))

    this.prerenderer.modifyServer('post-static')

    this.prerenderer.modifyServer('pre-fallback')

    if (this.options.server && this.options.server.proxy) {
      import('http-proxy-middleware').then(({ createProxyMiddleware }) => {
        for (const proxyPath of Object.keys(this.options.server.proxy)) {
          server.use(proxyPath, createProxyMiddleware(this.options.server.proxy[proxyPath]))
        }
      }).catch(() => {
        throw new Error('The http-proxy-middleware module could not be loaded, did you install it?')
      })
    }

    server.get('*', (req, res) => {
      res.sendFile(this.options.indexPath ? this.options.indexPath : path.join(this.options.staticDir, 'index.html'))
    })

    this.prerenderer.modifyServer('post-fallback')

    return new Promise<void>((resolve) => {
      this.nativeServer = server.listen(this.options.server.port, () => {
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
