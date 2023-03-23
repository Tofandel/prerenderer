import { PuppeteerRendererFinalOptions } from './Options'

declare global {
  interface Window {
    __PRERENDER_STATUS?: {
      _DOCUMENT_EVENT_RESOLVED?: boolean
    };
  }
}

export const listenForRender = (options: PuppeteerRendererFinalOptions) => {
  if (options.renderAfterDocumentEvent) {
    window.__PRERENDER_STATUS = {}
    document.addEventListener(options.renderAfterDocumentEvent, () => {
      window.__PRERENDER_STATUS = window.__PRERENDER_STATUS || {}
      window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED = true
    })
  }
}

export const waitForRender = (options: PuppeteerRendererFinalOptions) => {
  const timeout = options.timeout
  const event = options.renderAfterDocumentEvent

  return new Promise<void | string>((resolve) => {
    let fallback = true
    // Render when an event fires on the document.
    if (event) {
      fallback = false
      let tim: NodeJS.Timeout | null = null
      if (timeout) {
        tim = setTimeout(() => {
          const timeS = Math.round(timeout / 100) / 10
          // We don't use reject, because puppeteer wraps the error in it's own error message
          resolve(`Could not prerender: event '${event}' did not occur within ${timeS}s`)
        }, timeout)
      }

      if (window.__PRERENDER_STATUS && window.__PRERENDER_STATUS._DOCUMENT_EVENT_RESOLVED) {
        resolve()
      }
      document.addEventListener(event, () => {
        tim && clearTimeout(tim)
        resolve()
      })
    }
    if (options.renderAfterElementExists) {
      fallback = false // Don't resolve because we are in Promise.race
    }
    // Render after a certain number of milliseconds.
    if (options.renderAfterTime) {
      fallback = false
      setTimeout(() => resolve(), options.renderAfterTime)
    }

    // Default: Render immediately after page content loads.
    if (fallback) {
      resolve()
    }
  })
}
