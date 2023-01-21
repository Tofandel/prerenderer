import Prerenderer from './Prerenderer'
import { Stage } from './Server'

export type RenderedRoute =
{
  originalRoute: string,
  route: string,
  html: string,
  outputPath?: string
}

interface IRenderer {
  modifyServer?(prerenderer: Prerenderer, stage: Stage): void
  preServer?(prerendererer: Prerenderer): void
}

abstract class IRenderer {
  // eslint-disable-next-line no-useless-constructor,@typescript-eslint/no-empty-function
  constructor (_options?: Record<string, unknown>) {
  }

  abstract destroy(): Promise<void> | void
  abstract initialize(): Promise<void> | void
  abstract renderRoutes(routes: Array<string>, prerenderer: Prerenderer): Promise<Array<RenderedRoute>>
}

export default IRenderer
