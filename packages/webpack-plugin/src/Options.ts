import { Schema } from 'schema-utils/declarations/validate'
import { IRenderer, RenderedRoute, PrerendererOptions } from '@prerenderer/prerenderer'

export interface WebpackPrerenderSPAOptions extends PrerendererOptions {
  indexPath?: string
  entryPath?: string
  renderer?: IRenderer
  routes: Array<string>
  postProcess?(renderedRoutes: Array<RenderedRoute>): Promise<void> | void
  urlModifier?(url: string): string
  rendererOptions?: Record<string, unknown>
}

export const schema: Schema = {
  properties: {
    indexPath: {
      description: 'The location of index.html',
      type: 'string',
    },
    entryPath: {
      description: 'The entry index.html file to use',
      type: 'string',
    },
    renderer: {
      description: 'A custom PuppeteerRenderer instance',
      required: true,
    },
    routes: {
      description: 'A list of routes to pre-render',
      type: 'array',
      required: true,
      items: {
        description: 'The path of the route',
        type: 'string',
      },
    },
    postProcess: {
      description: 'Allows you to customize the HTML and output path before writing the rendered contents to a file.',
      instanceof: 'Function',
    },
    server: {
      type: 'object',
      properties: {
        port: {
          description: 'Normally a free port is autodetected, but feel free to set this if needed.',
          type: 'number',
        },
      },
      additionalProperties: true,
    },
    urlModifier: {
      instanceof: 'Function',
      description: 'Hook to be able to modify the url to retrieve the compiled asset',
    },
    rendererOptions: {
      type: 'object',
      additionalProperties: true,
      properties: {
        injectProperty: {
          description: 'The name of the property to add to the window object with the contents of `inject`',
          type: 'string',
        },
        inject: {
          description: "Any values you'd like your app to have access to via `window.injectProperty",
          type: 'object',
          additionalProperties: true,
        },
        maxConcurrentRoutes: {
          type: 'number',
          description: 'Use this to limit the number of routes rendered in parallel. Defaults to 0, no limit',
        },
        renderAfterDocumentEvent: {
          type: 'string',
          description: "Wait to render until the specified event is dispatched on the document. eg: with `document.dispatchEvent(new Event('custom-render-trigger')",
        },
        renderAfterElementExists: {
          type: 'string',
          description: 'Wait to render until the specified element is detected using `document.querySelector`',
        },
        renderAfterTime: {
          type: 'number',
          description: 'Wait to render until a certain amount of time has passed. NOT RECOMMENDED',
        },
        headless: {
          type: 'boolean',
          description: 'Display the browser window when rendering. Useful for debugging.',
        },
      },
    },
  },
  type: 'object',
}
