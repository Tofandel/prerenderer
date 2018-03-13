const express = require('express')
const proxy = require('http-proxy-middleware')
const path = require('path')

class Server {
  constructor (Prerenderer) {
    this._prerenderer = Prerenderer
    this._options = Prerenderer.getOptions()
    this._expressServer = express()
    this._nativeServer = null
  }

  initialize () {
    const server = this._expressServer

    this._prerenderer.modifyServer(this, 'pre-static')

    server.get('*.*', express.static(this._options.staticDir, {
      dotfiles: 'allow'
    }))

    this._prerenderer.modifyServer(this, 'post-static')

    this._prerenderer.modifyServer(this, 'pre-fallback')

    if (this._options.server && this._options.server.proxy) {
      for (let proxyPath of Object.keys(this._options.server.proxy)) {
        server.use(proxyPath, proxy(this._options.server.proxy[proxyPath]))
      }
    }

    server.get('*', (req, res) => {
      res.sendFile(this._options.indexPath ? this._options.indexPath : path.join(this._options.staticDir, 'index.html'))
    })

    this._prerenderer.modifyServer(this, 'post-fallback')

    return new Promise((resolve, reject) => {
      this._nativeServer = server.listen(this._options.server.port, () => {
        resolve()
      })
    })
  }

  destroy () {
    this._nativeServer.close()
  }
}

module.exports = Server
