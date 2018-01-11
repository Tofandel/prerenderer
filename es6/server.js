const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

class Server {
  constructor (Prerenderer) {
    this._prerenderer = Prerenderer
    this._options = Prerenderer.getOptions()
    this._expressServer = express()
    this._nativeServer = null

    this._expressServer.use(bodyParser.json({
      limit: '100mb'
    }))

    this._expressServer.use(bodyParser.urlencoded({
      limit: '100mb',
      extended: true,
      parameterLimit: 50000,
    }))
  }

  initialize () {
    const server = this._expressServer

    this._prerenderer.modifyServer(this, 'pre-static')

    server.get('*.*', express.static(this._options.staticDir, {
      dotfiles: 'allow'
    }))

    this._prerenderer.modifyServer(this, 'post-static')

    this._prerenderer.modifyServer(this, 'pre-fallback')

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
