# @prerenderer/rollup-plugin

This package is part of the `@prerenderer` monorepo, for the rest of the documentation head over to https://github.com/Tofandel/prerenderer#prerendererwebpack-plugin-options

### Requirements
This plugin is for rollup (or vite), it's fairly recent and for now should be treated as experimental, don't hesitate to report any issue you encounter to help make this plugin better
It was written based on the webpack-plugin, thus works similarly and has the same options

### Installation
`npm i -D @prerenderer/rollup-plugin @prerenderer/renderer-puppeteer`
or
`npm i -D @prerenderer/rollup-plugin @prerenderer/renderer-jsdom`

### Basic Usage (`vite.config.js`)
```js
import { defineConfig } from 'vite'
import prerender from '@prerenderer/rollup-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [prerender({
    routes: ['/'],
    renderer: '@prerenderer/renderer-puppeteer',
    rendererOptions: {
        renderAfterDocumentEvent: 'custom-render-trigger',
    },
    postProcess (renderedRoute) {
      // Replace all http with https urls and localhost to your site url
      renderedRoute.html = renderedRoute.html.replace(
        /http:/ig,
        'https:',
      ).replace(
        /(https:\/\/)?(localhost|127\.0\.0\.1):\d*/ig,
        (process.env.CI_ENVIRONMENT_URL || ''),
      );
    },
  })],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})

```

Don't forget to trigger the custom event you set in `renderAfterDocumentEvent` in your app when the page is ready to be renderer (Eg: onMounted for vue)

```js
document.dispatchEvent(new Event('custom-render-trigger'))
```
