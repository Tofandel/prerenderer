import { PrerendererOptions } from '@prerenderer/prerenderer'
import { JSONSchemaType } from 'ajv'
import { Schema } from 'schema-utils/declarations/validate'

export interface RollupPrerenderOptions extends Omit<PrerendererOptions, 'staticDir' | 'renderer'> {
  entryPath?: string
  routes?: Array<string>
  urlModifier?(url: string): string
}

export const defaultOptions = {
  indexPath: 'index.html',
  routes: ['/'],
}

export type RollupPrerenderFinalOptions = RollupPrerenderOptions & typeof defaultOptions

export const schema: JSONSchemaType<Omit<RollupPrerenderOptions, keyof PrerendererOptions>> | Schema = {
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
    urlModifier: {
      instanceof: 'Function',
      description: 'Hook to be able to modify the url to retrieve the compiled asset',
    },
  },
}
