const Server = require('./server')
const ChromeRenderer = require('./renderers/chrome')
const JSDOMRenderer = require('./renderers/jsdom')

const PortFinder = require('portfinder')

const PackageName = '[Prerenderer]'

function validateOptions (options) {
  const stringTypes = [
    'staticDir',
    'indexPath',
    'injectName'
  ]

  if (!options) throw new Error(`${PackageName} Options must be defined!`)

  if (!options.staticDir) throw new Error(`${PackageName} Unable to prerender. No "staticDir" was defined.`)
  if (typeof options.staticDir !== 'string') throw new TypeError(`${PackageName} Unable to prerender. "staticDir" must be a string.`)

  stringTypes.forEach(type => {
    if (options[type] && typeof options[type] !== 'string') throw new TypeError(`${PackageName} Unable to prerender. "${type}" must be a string.`)
  })

  return true
}

class Prerenderer {
  constructor (options) {
    this._options = options || {}
    this._server = new Server(this._options)
    this._renderer = (options.renderer && typeof options.renderer.initialize === 'function')
      ? options.renderer
      : new JSDOMRenderer(options.renderer || {})

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

  renderRoutes (routes) {
    return this._renderer.renderRoutes(routes, this._options.server.port, this._options)
  }
}

Prerenderer.ChromeRenderer = ChromeRenderer
Prerenderer.JSDOMRenderer = JSDOMRenderer

module.exports = Prerenderer
