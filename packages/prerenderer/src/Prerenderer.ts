import Server from './Server'
import { getPortPromise } from 'portfinder'
import { schema, PrerendererOptions } from './PrerendererOptions'
import IRenderer from './IRenderer'
import PackageName from './PackageName'
import { validate } from 'schema-utils'

export default class Prerenderer {
  private readonly options: PrerendererOptions
  private readonly server: Server
  private readonly renderer: IRenderer

  constructor (options: PrerendererOptions) {
    validate(schema, options, { name: PackageName })
    this.options = options

    this.server = new Server(this)
    this.renderer = options.renderer

    if (this.renderer && this.renderer.preServer) this.renderer.preServer(this)

    if (!this.options) throw new Error(`${PackageName} Options must be defined!`)

    if (!this.options.renderer) {
      throw new Error(`${PackageName} No renderer was passed to prerenderer.
If you are not sure which renderer to use, see the documentation at https://github.com/JoshTheDerf/prerenderer.`)
    }

    if (!this.options.server) this.options.server = {}
  }

  async initialize () {
    // Initialization is separate from construction because science? (Ideally to initialize the server and renderer separately.)
    this.options.server.port = this.options.server.port || await getPortPromise() || 13010
    await this.server.initialize()
    await this.renderer.initialize()

    return Promise.resolve()
  }

  async destroy () {
    await Promise.all([this.renderer.destroy(), this.server.destroy()])
  }

  public getServer () {
    return this.server
  }

  public getRenderer () {
    return this.renderer
  }

  public getOptions () {
    return this.options
  }

  modifyServer (stage: string) {
    if (this.renderer.modifyServer) {
      this.renderer.modifyServer(this, this.server, stage)
    }
  }

  renderRoutes (routes: string[]) {
    return this.renderer.renderRoutes(routes, this)
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
