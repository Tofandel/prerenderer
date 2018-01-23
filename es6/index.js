const Server = require('./server')
const PortFinder = require('portfinder')

const PackageName = '[Prerenderer]'

function validateOptions (options) {
  const stringTypes = [
    'staticDir',
    'indexPath'
  ]

  if (!options) throw new Error(`${PackageName} Options must be defined!`)

  if (!options.renderer) {
    throw new Error(`${PackageName} No renderer was passed to prerenderer.
If you are not sure wihch renderer to use, see the documentation at https://github.com/tribex/prerenderer.`)
  }

  if (!options.staticDir) throw new Error(`${PackageName} Unable to prerender. No "staticDir" was defined.`)

  stringTypes.forEach(type => {
    if (options[type] && typeof options[type] !== 'string') throw new TypeError(`${PackageName} Unable to prerender. "${type}" must be a string.`)
  })

  return true
}

class Prerenderer {
  constructor (options) {
    this._options = options || {}

    this._server = new Server(this)
    this._renderer = options.renderer

    if (this._renderer && this._renderer.preServer) this._renderer.preServer(this)

    validateOptions(this._options)
  }

  async initialize () {
    // Initialization is separate from construction because science? (Ideally to initialize the server and renderer separately.)
    this._options.server.port = this._options.server.port || await PortFinder.getPortPromise() || 13010
    await this._server.initialize()
    await this._renderer.initialize()

    return Promise.resolve()
  }

  destroy () {
    this._renderer.destroy()
    this._server.destroy()
  }

  getServer () {
    return this._server
  }

  getRenderer () {
    return this._renderer
  }

  getOptions () {
    return this._options
  }

  modifyServer (server, stage) {
    if (this._renderer.modifyServer) this._renderer.modifyServer(this, server, stage)
  }

  renderRoutes (routes) {
    return this._renderer.renderRoutes(routes, this)
  }
}

module.exports = Prerenderer
