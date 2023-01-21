import { validate } from 'schema-utils'
import { defaultOptions, schema, WebpackPrerenderSPAFinalOptions, WebpackPrerenderSPAOptions } from './Options'
import { Compiler, Compilation, WebpackError } from 'webpack'
import deepMerge from 'ts-deepmerge'
import path from 'path'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Schema } from 'schema-utils/declarations/validate'
import { IRenderer } from '@prerenderer/prerenderer'

export default class WebpackPrerenderSPAPlugin {
  private readonly options: WebpackPrerenderSPAFinalOptions

  constructor (options: WebpackPrerenderSPAOptions = {}) {
    validate(schema as Schema, options, {
      name: 'Prerender SPA Plugin',
      baseDataPath: 'options',
    })

    this.options = deepMerge.withOptions({ mergeArrays: false }, defaultOptions, options) as WebpackPrerenderSPAFinalOptions
  }

  async prerender (compiler: Compiler, compilation: Compilation) {
    const indexPath = this.options.indexPath
    const entryPath = this.options.entryPath || indexPath

    if (!(entryPath in compilation.assets)) {
      return false
    }
    const { default: Prerenderer } = await import('@prerenderer/prerenderer')

    let renderer: IRenderer
    if (typeof this.options.renderer === 'string') {
      const { default: RendererClass } = ((await import(this.options.renderer)) as {default: IRenderer})
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      renderer = new RendererClass(this.options.rendererOptions) as IRenderer
    } else {
      renderer = this.options.renderer
    }

    const PrerendererInstance = new Prerenderer({
      staticDir: compiler.options.output.path || '/',
      ...this.options,
      renderer,
    })
    PrerendererInstance.hookServer((server) => {
      const express = server.getExpressServer()
      // Express doesn't have complete typings yet
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const routes = express._router.stack as Array<{route:{path:string}}>
      routes.forEach((route, i) => {
        if (route.route && route.route.path === '*') {
          routes.splice(i, 1)
        }
      }, 'post-fallback')

      express.get('*', (req, res) => {
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
            const source = compilation.assets[url].source()
            res.json(JSON.parse(typeof source === 'string' ? source : source.toString()))
          } else {
            try {
              res.type(path.extname(url))
              res.send(compilation.assets[url].source())
            } catch (e) {
              res.status(500)
              compilation.errors.push(new WebpackError('[prerender-spa-plugin] Failed to deliver ' + url + ', is the type of the file correct?'))
            }
          }
        } else if (entryPath in compilation.assets) {
          res.send(compilation.assets[entryPath].source())
        } else {
          compilation.errors.push(new WebpackError('[prerender-spa-plugin] ' + url + ' not found during prerender'))
          res.status(404)
        }
      })
    })

    try {
      await PrerendererInstance.initialize()
      const renderedRoutes = await PrerendererInstance.renderRoutes(this.options.routes || [])

      // Run postProcess hooks.
      if (typeof this.options.postProcess === 'function') {
        const postProcess = this.options.postProcess
        await Promise.all(renderedRoutes.map(renderedRoute => postProcess(renderedRoute)))

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
        // false positive as calling call(compilation) right after
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const fn = processedRoute.outputPath in compilation.assets ? compilation.updateAsset : compilation.emitAsset
        fn.call(compilation, processedRoute.outputPath, new compiler.webpack.sources.RawSource(processedRoute.html.trim(), false), {
          prerendered: true,
        })
      })
    } catch (err: unknown) {
      const msg = '[prerender-spa-plugin] Unable to prerender all routes!'
      compilation.errors.push(new WebpackError(msg))
      if (typeof err === 'object' && err && err.toString) {
        compilation.errors.push(new WebpackError(err.toString()))
      }
    }

    await PrerendererInstance.destroy()
  }

  apply (compiler: Compiler) {
    const pluginName = this.constructor.name
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation)

      hooks.afterEmit.tapPromise(pluginName, async (out) => {
        await this.prerender(compiler, compilation)
        return out
      })
    })
  }
}
