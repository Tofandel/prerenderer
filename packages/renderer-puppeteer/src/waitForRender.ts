import { PuppeteerRendererOptions } from './Options'

declare global {
  interface Window {
    __PRERENDER_STATUS?: {
      _DOCUMENT_EVENT_RESOLVED?: boolean
    };
  }
}

export const listenForRender = (options: PuppeteerRendererOptions) => {
  window.__PRERENDER_STATUS = {}
  document.addEventListener(options.renderAfterDocumentEvent, () => {
    window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED = true
  })
}

export const waitForRender = (options: PuppeteerRendererOptions) => {
  return new Promise<void>((resolve) => {
    // Render when an event fires on the document.
    if (options.renderAfterDocumentEvent) {
      if (window.__PRERENDER_STATUS && window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED) resolve()
      document.addEventListener(options.renderAfterDocumentEvent, () => resolve())
      // Render after a certain number of milliseconds.
    } else if (options.renderAfterTime) {
      setTimeout(() => resolve(), options.renderAfterTime)

      // Default: Render immediately after page content loads.
    } else {
      resolve()
    }
  })
}
