# @prerenderer/webpack-plugin

This package is part of the `@prerenderer` monorepo, for the rest of the documentation head over to https://github.com/Tofandel/prerenderer#prerendererwebpack-plugin-options

### Requirements
This plugin is for webpack 5 and requires the html-webpack-plugin to be setup

### Installation
`npm i -D @prerenderer/webpack-plugin @prerenderer/renderer-puppeteer`
or
`npm i -D @prerenderer/webpack-plugin @prerenderer/renderer-jsdom`

### Basic Usage (`webpack.config.js`)
```js
const path = require('path')
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin')

module.exports = {
  plugins: [
    ...
    new PrerendererWebpackPlugin({
      // Required - Routes to render.
      routes: [ '/', '/about', '/some/deep/nested/route' ],
      //renderer: '@prerenderer/renderer-jsdom', // Uncomment if you want to use jsdom
    })
  ]
}
```

### Advanced Usage (`webpack.config.js`)

```js
const path = require('path')
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin')

module.exports = {
  plugins: [
    ...
    new PrerendererWebpackPlugin({
      // Optional - The location of index.html
      indexPath: 'index.html',

      // Required - Routes to render.
      routes: [ '/', '/about', '/some/deep/nested/route' ],

      // Optional - Allows you to customize the HTML and output path before
      // writing the rendered contents to a file.
      // renderedRoute can be modified and it or an equivalent should be returned.
      // renderedRoute format:
      // {
      //   route: String, // Where the output file will end up (relative to outputDir)
      //   originalRoute: String, // The route that was passed into the renderer, before redirects.
      //   html: String, // The rendered HTML for this route.
      //   outputPath: String // The path the rendered HTML will be written to.
      // }
      postProcess (renderedRoute) {
        // Ignore any redirects.
        renderedRoute.route = renderedRoute.originalRoute
        // Basic whitespace removal. (Don't use this in production.)
        renderedRoute.html = renderedRoute.html.split(/>[\s]+</gmi).join('><')
        // Remove /index.html from the output path if the dir name ends with a .html file extension.
        // For example: /dist/dir/special.html/index.html -> /dist/dir/special.html
        if (renderedRoute.route.endsWith('.html')) {
          renderedRoute.outputPath = path.join(__dirname, 'dist', renderedRoute.route)
        }

        // Replace all http with https urls and localhost to your site url
        renderedRoute.html = renderedRoute.html.replace(
          /http:/i,
          'https:',
        ).replace(
          /(https:\/\/)?(localhost|127\.0\.0\.1):\d*/i,
          (process.env.CI_ENVIRONMENT_URL || ''),
        );
      },

      // Server configuration options.
      server: {
        // Normally a free port is autodetected, but feel free to set this if needed.
        port: 8001
      },
      renderer: '@prerenderer/renderer-puppeteer',
      // The actual renderer to use. (Feel free to write your own)
      // Available renderers: https://github.com/Tofandel/prerenderer#available-renderers

      //The options to pass to the renderer class's constructor
      rendererOptions: {
        // Optional - The name of the property to add to the window object with the contents of `inject`.
        injectProperty: '__PRERENDER_INJECTED',
        // Optional - Any values you'd like your app to have access to via `window.injectProperty`.
        inject: {
          foo: 'bar'
        },

        // Optional - defaults to 0, no limit.
        // Routes are rendered asynchronously.
        // Use this to limit the number of routes rendered in parallel.
        maxConcurrentRoutes: 4,

        // Optional - Wait to render until the specified event is dispatched on the document.
        // eg, with `document.dispatchEvent(new Event('custom-render-trigger'))`
        renderAfterDocumentEvent: 'custom-render-trigger',

        // Optional - Wait to render until the specified element is detected using `document.querySelector`
        renderAfterElementExists: 'my-app-element',

        // Optional - Wait to render until a certain amount of time has passed.
        // NOT RECOMMENDED
        renderAfterTime: 5000, // Wait 5 seconds.
        // Optional - Cancel render if it takes more than a certain amount of time
        // useful in combination with renderAfterDocumentEvent as it will avoid waiting infinitely if the event doesn't fire
        timeout: 20000, // Cancel render if it takes more than 20 seconds

        // Other puppeteer options.
        // (See here: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)
        headless: false // Display the browser window when rendering. Useful for debugging.
      }
    })
  ]
}
```

```js
const path = require('path')
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin')

module.exports = {

  // ...

  plugins: [
    new PrerendererWebpackPlugin({
        // (REQUIRED) List of routes to prerender
        routes:  [ '/', '/about', '/contact' ],

        rendererOptions: {
            // headless: false,
            renderAfterDocumentEvent: 'render-event',
            inject: {},
            timeout: 10000,
        },
        postProcess: function (context) {
          var titles = {
            '/': 'Home',
            '/about': 'Our Story',
            '/contact': 'Contact Us'
          }
          context.html = context.html.replace(
            /<title>[^<]*<\/title>/i,
            '<title>' + titles[context.route] + '</title>'
          )
        }
      }
    )
  ]
}
```
