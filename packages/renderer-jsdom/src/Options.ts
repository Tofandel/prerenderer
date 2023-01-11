import { JSONSchemaType } from 'ajv'

export interface JSDOMRendererOptions {
  maxConcurrentRoutes?: number
  renderAfterDocumentEvent?: string
  renderAfterElementExists?: string
  renderAfterTime?: number
  inject?: unknown
  injectProperty?: string
  timeout?: number
  skipThirdPartyRequests?: boolean
}

export const defaultOptions = {
  injectProperty: '__PRERENDER_INJECTED',
  maxConcurrentRoutes: 0,
  skipThirdPartyRequests: false,
  timeout: 1000 * 60 * 2,
}

export type JSDOMRendererFinalOptions = JSDOMRendererOptions & typeof defaultOptions

export const schema: JSONSchemaType<Omit<JSDOMRendererOptions, 'inject'>> = {
  type: 'object',
  additionalProperties: true,
  oneOf: [
    { required: ['renderAfterDocumentEvent'] },
    { required: ['renderAfterElementExists'] },
    { required: ['renderAfterTime'] },
  ],
  properties: {
    maxConcurrentRoutes: {
      type: 'number',
      nullable: true,
    },
    renderAfterDocumentEvent: {
      type: 'string',
      description: 'The name of the event that should trigger the rendering of the page',
      nullable: true,
    },
    renderAfterElementExists: {
      type: 'string',
      description: 'Wait until this selector is found on the page',
      nullable: true,
    },
    renderAfterTime: {
      type: 'number',
      description: 'Time to wait for in ms before rendering the page',
      nullable: true,
    },
    timeout: {
      type: 'number',
      description: 'The time in ms after which we should stop waiting and throw an error',
      nullable: true,
    },
    injectProperty: {
      type: 'string',
      description: 'The key of the injected value into window',
      nullable: true,
    },
    skipThirdPartyRequests: {
      type: 'boolean',
      description: 'Automatically block any third-party requests. (This can make your pages load faster by not loading non-essential scripts, styles, or fonts.)',
      nullable: true,
    },
  },
}
