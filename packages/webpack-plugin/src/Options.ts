import { RenderedRoute, PrerendererOptions } from '@prerenderer/prerenderer'
import { JSONSchemaType } from 'ajv'
import { Schema } from 'schema-utils/declarations/validate'

export interface WebpackPrerenderSPAOptions extends Omit<PrerendererOptions, 'staticDir'> {
  entryPath?: string
  fallback?: boolean | string
  routes?: Array<string>
  postProcess?: (renderedRoutes: RenderedRoute) => Promise<void> | void
  urlModifier?(url: string): string
}

export const defaultOptions = {
  indexPath: 'index.html',
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
    fallback: {
      oneOf: [
        { type: 'string' },
        { type: 'boolean' },
      ],
      description: 'Generate a fallback file if the asset already exists',
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
    urlModifier: {
      instanceof: 'Function',
      description: 'Hook to be able to modify the url to retrieve the compiled asset',
    },
  },
}
