import Prerenderer from './Prerenderer'
import Server from './Server'

export type RenderedRoute =
{
  originalRoute: string,
  route: string,
  html: string,
}

export default interface IRenderer {
  destroy(),
  initialize(),
  modifyServer?(prerenderer: Prerenderer, server: Server, stage: string),
  renderRoutes(routes: Array<string>, prerenderer: Prerenderer): Promise<Array<RenderedRoute>>,
  preServer?(prerendererer: Prerenderer)
}
