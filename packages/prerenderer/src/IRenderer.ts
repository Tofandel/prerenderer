import Prerenderer from './Prerenderer'
import { Stage } from './Server'

export type RenderedRoute = {
  originalRoute: string,
  route: string,
  html: string,
  outputPath?: string
}

interface IRenderer {
  modifyServer?(prerenderer: Prerenderer, stage: Stage): void
  preServer?(prerendererer: Prerenderer): void
  destroy(): Promise<void> | void
  initialize(): Promise<void> | void
  renderRoutes(routes: Array<string>, prerenderer: Prerenderer): Promise<Array<RenderedRoute>>
}

export type RendererConstructor = { new(options?: Record<string, unknown> | object): IRenderer }

export default IRenderer
