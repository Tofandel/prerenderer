import { Schema } from 'schema-utils/declarations/validate'

export interface RendererJSDOMOptions {
  maxConcurrentRoutes?: number
  renderAfterDocumentEvent?: string
  renderAfterElementExists?: string
  inject?: unknown
  injectProperty?: string
  renderAfterTime?: number
  timeout?: number
  args?: Array<string>
  skipThirdPartyRequests?: boolean
}

export const schema: Schema = {
  properties: {
  }
}
