const express = require('express')
const path = require('path')

class Server {
  constructor (options) {
    this._options = options
    this._serverInstance = null
    this._nativeServer = null
  }

  initialize () {
    const server = express()
    this._serverInstance = server

    server.use(express.static(this._options.staticDir, {
      dotfiles: 'allow'
    }))

    server.use('*', (req, res) => {
      res.sendFile(this._options.indexPath ? this._options.indexPath : path.join(this._options.staticDir, 'index.html'))
    })

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
