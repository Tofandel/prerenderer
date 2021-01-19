const jsdom = require('jsdom');

const cache = {};

module.exports = class CachingResourceLoader extends jsdom.ResourceLoader {
   fetch(url, options) {
      if (url.endsWith(".png") || url.endsWith(".svg") || url.endsWith(".gif") || url.endsWith(".jpg") || url.endsWith(".map") || url.indexOf("undefined") > -1) {
         return null;
      } else if (url.endsWith(".js") || url.endsWith(".css") || url.includes('fonts.googleapis.com/css'))
      {
         if (cache[url]) {
            return cache[url];
         } else {
            const response = super.fetch(url, options);
            cache[url] = response;

            return response;
         }
      }

      return super.fetch(url, options);
   }
};
