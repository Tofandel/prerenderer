import { validate } from 'schema-utils'
import { defaultOptions, schema, WebpackPrerenderSPAFinalOptions, WebpackPrerenderSPAOptions } from './Options'
import { Compiler, Compilation, WebpackError } from 'webpack'
import deepMerge from 'ts-deepmerge'
import path from 'path'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Schema } from 'schema-utils/declarations/validate'

export default class WebpackPrerenderSPAPlugin {
  private readonly options: WebpackPrerenderSPAFinalOptions

  constructor (options: WebpackPrerenderSPAOptions = {}) {
    validate(schema as Schema, options, {
      name: 'Prerender SPA Plugin',
      baseDataPath: 'options',
    })

    this.options = deepMerge.withOptions({ mergeArrays: false }, defaultOptions, options) as WebpackPrerenderSPAFinalOptions
  }

  async prerender (compiler: Compiler, compilation: Compilation, alreadyRenderedRoutes: Array<string> = []) {
    const indexPath = this.options.indexPath
    const entryPath = this.options.entryPath || indexPath

    if (!(entryPath in compilation.assets)) {
      compilation.errors.push(new WebpackError('[prerender-spa-plugin] Could not find the entryPath! Doing nothing.'))
      return false
    }
    const { default: Prerenderer } = await import('@prerenderer/prerenderer')

    const PrerendererInstance = new Prerenderer({
      staticDir: compiler.options.output.path || '/',
      ...this.options,
    })
    // Modify the express server to serve the files from the webpack compiler because they are not written on disk yet
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
        let url = req.path.slice(0, req.path.endsWith('/') ? -1 : undefined)

        const publicPath = typeof compilation.outputOptions.publicPath === 'string' && compilation.outputOptions.publicPath !== 'auto'
          ? compilation.outputOptions.publicPath || '/'
          : '/'

        if (url.startsWith(publicPath)) {
          url = url.slice(publicPath.length)
        }
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
      const routes = [...new Set(this.options.routes || [])]
      if (routes.length) {
        await PrerendererInstance.initialize()
        const renderedRoutes = await PrerendererInstance.renderRoutes(routes)
        alreadyRenderedRoutes.concat(routes)

        // Calculate outputPath if it hasn't been set already.
        renderedRoutes.forEach(processedRoute => {
          // Create dirs and write prerendered files.
          if (!processedRoute.outputPath) {
            processedRoute.outputPath = path.join(processedRoute.route, indexPath)

            if (processedRoute.outputPath.startsWith('/') || processedRoute.outputPath.startsWith('\\')) {
              processedRoute.outputPath = processedRoute.outputPath.slice(1)
            }
          }
          if (processedRoute.outputPath in compilation.assets && this.options.fallback) {
            const fallback = typeof this.options.fallback === 'string' ? this.options.fallback : '_fallback'
            const ext = path.extname(processedRoute.outputPath)
            const fileName = processedRoute.outputPath.slice(0, -ext.length) + fallback + ext
            if (!(fileName in compilation.assets)) {
              compilation.emitAsset(fileName, compilation.assets[processedRoute.outputPath])
            }
          }
          // false positive as calling call(compilation) right after
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const fn = processedRoute.outputPath in compilation.assets ? compilation.updateAsset : compilation.emitAsset
          fn.call(compilation, processedRoute.outputPath, new compiler.webpack.sources.RawSource(processedRoute.html.trim(), false), {
            prerendered: true,
          })
        })
      }
    } catch (err: unknown) {
      const msg = '[prerender-spa-plugin] Unable to prerender all routes!'
      compilation.errors.push(new WebpackError(msg))
      if (err instanceof Error) {
        compilation.errors.push(new WebpackError(err.message))
      } else if (typeof err === 'object' && err) {
        compilation.errors.push(new WebpackError(err.toString()))
      }
    }

    await PrerendererInstance.destroy()
  }

  apply (compiler: Compiler) {
    const pluginName = this.constructor.name
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Check if HtmlWebpackPlugin was used in the compilation
      const isHtmlWebpackPluginUsed = compiler.options.plugins.some(
        (plugin) => plugin instanceof HtmlWebpackPlugin,
      )
      if (!isHtmlWebpackPluginUsed) {
        compilation.warnings.push(new WebpackError('[prerender-spa-plugin] The HtmlWebpackPlugin is missing from webpack, the prerender plugin will do nothing.'))
      } else {
        const hooks = HtmlWebpackPlugin.getHooks(compilation)

        hooks.afterEmit.tapPromise(pluginName, async (out) => {
          await this.prerender(compiler, compilation)
          return out
        })
      }
    })
  }
}
