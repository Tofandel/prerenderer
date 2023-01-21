import { RenderedRoute, PrerendererOptions, IRenderer } from '@prerenderer/prerenderer'
import { JSONSchemaType } from 'ajv'
import { JSDOMRendererOptions } from '@prerenderer/renderer-jsdom'
import { PuppeteerRendererOptions } from '@prerenderer/renderer-puppeteer'
import { Schema } from 'schema-utils/declarations/validate'

type rendererOptions = JSDOMRendererOptions | PuppeteerRendererOptions | Record<string, unknown>
export type RendererClass = { new(options?: rendererOptions): IRenderer }

export interface WebpackPrerenderSPAOptions extends Omit<PrerendererOptions, 'staticDir' | 'renderer'> {
  entryPath?: string
  routes?: Array<string>
  postProcess?: (renderedRoutes: RenderedRoute) => Promise<void> | void
  urlModifier?(url: string): string
  rendererOptions?: rendererOptions
  renderer?: string | IRenderer | { new(options?: rendererOptions): IRenderer }
}

export const defaultOptions = {
  indexPath: 'index.html',
  rendererOptions: {
    headless: true,
  },
  renderer: '@prerenderer/renderer-puppeteer',
  routes: ['/'],
}

export type WebpackPrerenderSPAFinalOptions = WebpackPrerenderSPAOptions & typeof defaultOptions

export const schema: JSONSchemaType<Omit<WebpackPrerenderSPAOptions, keyof PrerendererOptions>> | Schema = {
  type: 'object',
  properties: {
    entryPath: {
      description: 'The entry index.html file to use',
      type: 'string',
      nullable: true,
    },
    routes: {
      description: 'A list of routes to pre-render',
      type: 'array',
      nullable: true,
      items: {
        description: 'The path of the route',
        type: 'string',
      },
    },
    postProcess: {
      description: 'Allows you to customize the HTML and output path before writing the rendered contents to a file.',
      instanceof: 'Function',
    },
    urlModifier: {
      instanceof: 'Function',
      description: 'Hook to be able to modify the url to retrieve the compiled asset',
    },
    renderer: {
      anyOf: [
        {
          type: 'string',
        },
        {
          instanceof: 'Function',
        },
        {
          type: 'object',
          additionalProperties: true,
        },
      ],
    },
    rendererOptions: {
      type: 'object',
      description: 'The options to pass to the renderer',
      additionalProperties: true,
      nullable: true,
    },
  },
}
