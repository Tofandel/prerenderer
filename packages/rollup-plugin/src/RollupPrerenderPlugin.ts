import { validate } from 'schema-utils'
import { defaultOptions, schema, RollupPrerenderFinalOptions, RollupPrerenderOptions } from './Options'
import deepMerge from 'ts-deepmerge'
import path from 'path'

import { Schema } from 'schema-utils/declarations/validate'
import { EmittedAsset, OutputPlugin } from 'rollup'

export default function RollupPrerenderPlugin (options: RollupPrerenderOptions = {}): OutputPlugin {
  validate(schema as Schema, options, {
    name: 'Prerender Plugin',
    baseDataPath: 'options',
  })

  const opts = deepMerge.withOptions({ mergeArrays: false }, defaultOptions, options) as RollupPrerenderFinalOptions

  return {
    name: 'Prerender Plugin',
    generateBundle: {
      order: 'post',
      async handler (output, bundle) {
        const indexPath = opts.indexPath
        const entryPath = opts.entryPath || indexPath
        const defaultBundle = bundle[entryPath]

        const { default: Prerenderer } = await import('@prerenderer/prerenderer')

        const PrerendererInstance = new Prerenderer({
          staticDir: output.dir || '/',
          ...options,
        })
        PrerendererInstance.hookServer((server) => {
          const express = server.getExpressServer()
          // Express doesn't have complete typings yet
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const routes = express._router.stack as Array<{ route: { path: string } }>
          routes.forEach((route, i) => {
            if (route.route && route.route.path === '*') {
              routes.splice(i, 1)
            }
          }, 'post-fallback')

          express.get('*', (req, res) => {
            let url = req.path.slice(1, req.path.endsWith('/') ? -1 : undefined)
            url = url in bundle || url.includes('.') ? url : (url + '/' + indexPath)
            if (url.startsWith('/')) {
              url = url.slice(1)
            }
            if (options.urlModifier) {
              url = options.urlModifier(url)
            }
            if (url in bundle) {
              const chunk = bundle[url]
              if (url.endsWith('.json') && 'source' in chunk) {
                const source = chunk.source
                res.json(JSON.parse(typeof source === 'string' ? source : source.toString()))
              } else {
                try {
                  res.type(path.extname(url))
                  res.send('code' in chunk ? chunk.code : chunk.source)
                } catch (e) {
                  res.status(500)
                  this.error('Failed to deliver ' + url + ', is the type of the file correct?')
                }
              }
            } else if (defaultBundle && 'source' in defaultBundle) {
              res.send(defaultBundle.source)
            } else {
              this.error(url + ' not found during prerender')
              res.status(404)
            }
          })
        })

        try {
          await PrerendererInstance.initialize()
          const renderedRoutes = await PrerendererInstance.renderRoutes([...new Set(opts.routes || [])])

          // Calculate outputPath if it hasn't been set already.
          renderedRoutes.forEach(processedRoute => {
            // Create dirs and write prerendered files.
            if (!processedRoute.outputPath) {
              processedRoute.outputPath = path.join(processedRoute.route, indexPath)

              if (processedRoute.outputPath.startsWith('/') || processedRoute.outputPath.startsWith('\\')) {
                processedRoute.outputPath = processedRoute.outputPath.slice(1)
              }
            }

            if (bundle[processedRoute.outputPath]) {
              if (options.fallback) {
                const fallback = typeof options.fallback === 'string' ? options.fallback : '_fallback'
                const ext = path.extname(processedRoute.outputPath)
                const fileName = processedRoute.outputPath.slice(0, -ext.length) + fallback + ext
                if (!(fileName in bundle[processedRoute.outputPath])) {
                  this.emitFile({ ...bundle[processedRoute.outputPath] as EmittedAsset, fileName })
                }
              }
              delete bundle[processedRoute.outputPath]
            }
            const htmlFile: EmittedAsset = {
              type: 'asset',
              source: processedRoute.html.trim(),
              name: 'Prerendered route ' + processedRoute.route,
              fileName: processedRoute.outputPath,
              needsCodeReference: false,
            }

            this.emitFile(htmlFile)
          })
        } catch (err: unknown) {
          this.warn('Unable to prerender all routes!')
          if (err instanceof Error) {
            this.error(err.message)
          } else if (typeof err === 'object' && err) {
            this.error(err.toString())
          }
        }

        await PrerendererInstance.destroy()
      },
    },
  }
}
