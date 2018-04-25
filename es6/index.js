const Server = require('./server')
const PortFinder = require('portfinder')

const PACKAGE_NAME = '[Prerenderer]'

const OPTION_SCHEMA = {
  staticDir: {
    type: String,
    required: true
  },
  indexPath: {
    type: String,
    required: false
  }
}

function validateOptionsSchema (schema, options, parent) {
  var errors = []

  Object.keys(schema).forEach(key => {
    // Required options
    if (schema[key].required && !options[key]) {
      errors.push(`"${parent || ''}${key}" option is required!`)
      return
    // Options with default values or potential children.
    } else if (!options[key] && (schema[key].default || schema[key].children)) {
      options[key] = schema[key].default != null ? schema[key].default : {}
      // Non-required empty options.
    } else if (!options[key]) return

    // Array-type options
    if (Array.isArray(schema[key].type) && schema[key].type.indexOf(options[key].constructor) === -1) {
      console.log(schema[key].type.indexOf(options[key].constructor))
      errors.push(`"${parent || ''}${key}" option must be a ${schema[key].type.map(t => t.name).join(' or ')}!`)
      // Single-type options.
    } else if (!Array.isArray(schema[key].type) && options[key].constructor !== schema[key].type) {
      errors.push(`"${parent || ''}${key}" option must be a ${schema[key].type.name}!`)
      return
    }

    if (schema[key].children) {
      errors.push(...validateOptionsSchema(schema[key].children, options[key], key))
      return
    }
  })

  errors.forEach(function (error) {
    console.error(`${PACKAGE_NAME} ${error}`)
  })

  return errors
}

class Prerenderer {
  constructor (options) {
    this._options = options || {}

    this._server = new Server(this)
    this._renderer = options.renderer

    if (this._renderer && this._renderer.preServer) this._renderer.preServer(this)

    if (!this._options) throw new Error(`${PACKAGE_NAME} Options must be defined!`)

    if (!this._options.renderer) {
      throw new Error(`${PACKAGE_NAME} No renderer was passed to prerenderer.
If you are not sure wihch renderer to use, see the documentation at https://github.com/tribex/prerenderer.`)
    }

    if (!this._options.server) this._options.server = {}

    const optionValidationErrors = validateOptionsSchema(OPTION_SCHEMA, this._options)

    if (optionValidationErrors.length !== 0) throw new Error(`${PACKAGE_NAME} Options are invalid. Unable to prerender!`)
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
    // Handle non-ASCII or invalid URL characters in routes by normalizing them back to unicode.
    // Some browser environments may change unicode or special characters in routes to percent encodings.
    // We need to convert them back for saving in the filesystem.
    .then(renderedRoutes => {
      renderedRoutes.forEach(rendered => {
        rendered.route = decodeURIComponent(rendered.route)
      })

      return renderedRoutes
    })
  }
}

module.exports = Prerenderer
