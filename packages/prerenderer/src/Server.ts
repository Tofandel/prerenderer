import express from 'express'

import path from 'path'
import Prerenderer from './Prerenderer'
import { PrerendererFinalOptions } from './PrerendererOptions'
import { Server as HttpServer } from 'http'
import { getPortPromise } from 'portfinder'

export type Stage = 'pre-static' | 'post-static' | 'pre-fallback' | 'post-fallback' | 'post-listen'

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

  public getPrerenderer () {
    return this.prerenderer
  }

  async initialize () {
    const server = this.expressServer

    const originalPort = this.options.server.port
    this.options.server.port = this.options.server.port || await getPortPromise() || 13010

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

    // This is a workaround for a bug in jsdom that hangs the server
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    server.keepAliveTimeout = 10
    const serverPromise = () => new Promise<void>((resolve, reject) => {
      this.nativeServer = server.listen(this.options.server.port, this.options.server.listenHost, () => {
        resolve()
      })
      this.nativeServer.on('error', (err: Error) => {
        reject(err)
      })
    })

    let i = 0
    let success = false
    let error: Error | null = null
    while (!error && !success && i++ < 10) {
      await serverPromise().then(() => {
        if (originalPort && originalPort !== this.options.server.port) {
          console.warn(`The provided port (${originalPort}) is already in use, so port ${this.options.server.port} was used instead`)
        }
        success = true
      }).catch((e: Error) => {
        if (/EADDRINUSE/.test(e.message)) {
          return getPortPromise().then((port) => {
            this.options.server.port = port
          })
        } else {
          error = e
        }
      })
    }
    if (error) {
      throw error
    } else if (!success) {
      throw new Error('The server could not initialize for unknown reasons')
    }

    this.prerenderer.modifyServer('post-listen')
  }

  destroy () {
    return new Promise<void>(resolve => {
      this.nativeServer?.close(() => resolve())
    })
  }
}
