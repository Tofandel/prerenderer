import Prerenderer from './Prerenderer'
import Server from './Server'

export type RenderedRoute =
{
  originalRoute: string,
  route: string,
  html: string,
}

export default interface IRenderer {
  destroy(): Promise<void> | void,
  initialize(): Promise<void> | void,
  modifyServer?(prerenderer: Prerenderer, server: Server, stage: string): void,
  renderRoutes(routes: Array<string>, prerenderer: Prerenderer): Promise<Array<RenderedRoute>>,
  preServer?(prerendererer: Prerenderer): void
}
