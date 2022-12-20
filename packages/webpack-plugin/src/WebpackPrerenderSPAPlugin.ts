import { validate } from 'schema-utils'
import { schema, WebpackPrerenderSPAOptions } from './Options'
import { Compiler, Compilation } from 'webpack'

import path from 'path'
import IRenderer from '@prerenderer/prerenderer/src/IRenderer'

export default class WebpackPrerenderSPAPlugin {
  private readonly options: WebpackPrerenderSPAOptions
  private renderer: IRenderer
  constructor (options: WebpackPrerenderSPAOptions) {
    validate(schema, options, {
      name: 'Prerender SPA Plugin',
      baseDataPath: 'options',
    })

    this.options = options

    this.options.indexPath = this.options.indexPath || 'index.html'
    this.options.rendererOptions = Object.assign({ headless: true }, this.options.rendererOptions)
  }

  async prerender (compiler: Compiler, compilation: Compilation) {
    const { default: Prerenderer } = await import('@prerenderer/prerenderer')
    const indexPath = this.options.indexPath
    const entryPath = this.options.entryPath || indexPath

    if (!(entryPath in compilation.assets)) {
      return false
    }
    const PrerendererInstance = new Prerenderer({
      staticDir: compiler.options.output.path,
      ...this.options,
    })
    const prev = PrerendererInstance.modifyServer.bind(PrerendererInstance)
    PrerendererInstance.modifyServer = (server, stage) => {
      if (stage === 'post-fallback') {
        server = server._expressServer
        const routes = server._router.stack
        routes.forEach((route, i) => {
          if (route.route && route.route.path === '*') {
            routes.splice(i, 1)
          }
        })

        server.get('*', (req, res) => {
          let url = req.path.slice(1, req.path.endsWith('/') ? -1 : undefined)
          url = url in compilation.assets || url.includes('.') ? url : url + '/' + indexPath
          if (url.startsWith('/')) {
            url = url.slice(1)
          }
          if (this.options.urlModifier) {
            url = this.options.urlModifier(url)
          }
          if (url in compilation.assets) {
            if (url.endsWith('.json')) {
              res.json(JSON.parse(compilation.assets[url].source()))
            } else {
              try {
                res.type(path.extname(url))
                res.send(compilation.assets[url].source())
              } catch (e) {
                res.status(500)
                compilation.errors.push(new Error('[prerender-spa-plugin] Failed to deliver ' + url + ', is the type of the file correct?'))
              }
            }
          } else if (entryPath in compilation.assets) {
            res.send(compilation.assets[entryPath].source())
          } else {
            compilation.errors.push(new Error('[prerender-spa-plugin] ' + url + ' not found during prerender'))
            res.status(404)
          }
        })
      }
      prev.call(PrerendererInstance, server, stage)
    }

    try {
      await PrerendererInstance.initialize()
      const renderedRoutes = await PrerendererInstance.renderRoutes(this.options.routes || [])

      // Run postProcess hooks.
      if (typeof this.options.postProcess === 'function') {
        await Promise.all(renderedRoutes.map(renderedRoute => this.options.postProcess(renderedRoute)))
        // Check to ensure postProcess hooks returned the renderedRoute object properly.

        const isValid = renderedRoutes.every(r => typeof r === 'object')
        if (!isValid) {
          throw new Error('[prerender-spa-plugin] Rendered routes are not object, did you do something weird in postProcess?')
        }
      }

      // Calculate outputPath if it hasn't been set already.
      renderedRoutes.forEach(processedRoute => {
        // Create dirs and write prerendered files.
        if (!processedRoute.outputPath) {
          processedRoute.outputPath = path.join(processedRoute.route, indexPath)

          if (processedRoute.outputPath.startsWith('/') || processedRoute.outputPath.startsWith('\\')) {
            processedRoute.outputPath = processedRoute.outputPath.slice(1)
          }
        }
        const fn = processedRoute.outputPath in compilation.assets ? compilation.updateAsset : compilation.emitAsset
        fn.call(compilation, processedRoute.outputPath, new compiler.webpack.sources.RawSource(processedRoute.html.trim(), false), {
          prerendered: true,
        })
      })
    } catch (err) {
      const msg = '[prerender-spa-plugin] Unable to prerender all routes!'
      compilation.errors.push(new Error(msg))
      compilation.errors.push(err)
    }

    PrerendererInstance.destroy()
  }

  apply (compiler) {
    const pluginName = this.constructor.name
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const HtmlWebpackPlugin = require('html-webpack-plugin')
      const hooks = HtmlWebpackPlugin.getHooks(compilation)

      hooks.afterEmit.tapPromise(pluginName, async () => await this.prerender(compiler, compilation))
    })
  }
}
