import { RenderedRoute, PrerendererOptions } from '@prerenderer/prerenderer'
import { JSONSchemaType } from 'ajv'
import { JSDOMRendererOptions } from '@prerenderer/renderer-jsdom'
import { PuppeteerRendererOptions } from '@prerenderer/renderer-puppeteer'

export interface WebpackPrerenderSPAOptions extends Omit<PrerendererOptions, 'staticDir'> {
  entryPath?: string
  routes: Array<string>
  postProcess?: (renderedRoutes: RenderedRoute) => Promise<void> | void
  urlModifier?(url: string): string
  rendererOptions?: JSDOMRendererOptions | PuppeteerRendererOptions | Record<string, unknown>
}

export const defaultOptions = {
  indexPath: 'index.html',
  rendererOptions: {
    headless: true,
  },
}

export type WebpackPrerenderSPAFinalOptions = WebpackPrerenderSPAOptions & typeof defaultOptions

export const schema: JSONSchemaType<Omit<WebpackPrerenderSPAOptions, keyof PrerendererOptions>> = {
  type: 'object',
  required: ['routes'],
  properties: {
    entryPath: {
      description: 'The entry index.html file to use',
      type: 'string',
      nullable: true,
    },
    routes: {
      description: 'A list of routes to pre-render',
      type: 'array',
      nullable: false,
      items: {
        description: 'The path of the route',
        type: 'string',
      },
    },
    postProcess: {
      description: 'Allows you to customize the HTML and output path before writing the rendered contents to a file.',
      type: 'object',
      instanceof: 'Function',
      nullable: true,
    },
    urlModifier: {
      type: 'object',
      instanceof: 'Function',
      description: 'Hook to be able to modify the url to retrieve the compiled asset',
      nullable: true,
    },
    rendererOptions: {
      type: 'object',
      description: 'The options to pass to the renderer',
      additionalProperties: true,
      nullable: true,
    },
  },
}
