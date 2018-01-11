'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var opn = require('opn');
var promiseLimit = require('promise-limit');
var EventEmitter = require('events');

var getPageContents = function getPageContents(rendererOptions, rootOptions, originalRoute) {
  rendererOptions = rendererOptions || {};

  function send(result) {
    /* eslint-disable */
    // Obviously requires the fetch API.
    fetch(`http://localhost:${rootOptions.server.port}/__prerenderer-browser-route/renderer-completed`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }).then(function (res) {
      window.close();
    });
    /* eslint-enable */
  }

  function captureDocument() {
    var doctype = new window.XMLSerializer().serializeToString(document.doctype);
    var outerHTML = document.documentElement.outerHTML;

    var result = {
      route: originalRoute,
      html: doctype + outerHTML
    };

    return result;
  }

  // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
  if (rendererOptions.renderAfterDocumentEvent) {
    window.document.addEventListener(rendererOptions.renderAfterDocumentEvent, function () {
      return send(captureDocument());
    });

    // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
  } else if (rendererOptions.renderAfterElementExists) {
    var doc = window.document;
    // TODO: Try and get something MutationObserver-based working.
    setInterval(function () {
      if (doc.querySelector(rendererOptions.renderAfterElementExists)) send(captureDocument());
    }, 100);

    // CAPTURE AFTER A NUMBER OF MILLISECONDS
  } else if (rendererOptions.renderAfterTime) {
    setTimeout(function () {
      return send(captureDocument());
    }, rendererOptions.renderAfterTime);

    // DEFAULT: RUN IMMEDIATELY
  } else {
    send(captureDocument());
  }
};

var BrowserRenderer = function () {
  function BrowserRenderer(rendererOptions) {
    _classCallCheck(this, BrowserRenderer);

    this._rendererOptions = rendererOptions || {};
    this._routeEmitter = new EventEmitter();

    if (this._rendererOptions.maxConcurrentRoutes == null) this._rendererOptions.maxConcurrentRoutes = 0;

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED';
    }

    if (!this._rendererOptions.injectedScriptId) {
      this._rendererOptions.injectedScriptId = '__prerenderer-browser-injected-326eaade-583d-407b-bfcc-6f56c5507a55';
    }

    if (!this._rendererOptions.opn) this._rendererOptions.opn = {};

    this._rendererOptions.opn = Object.assign({}, this._rendererOptions.opn);
  }

  _createClass(BrowserRenderer, [{
    key: 'addRouteListener',
    value: function addRouteListener() {}

    /**
     * Internal, dangerous, allows you to modify the server before anything is initialized.
     * You really shouldn't need this. Avoid at all costs.
     * @param {Prerenderer} Prerenderer the prerenderer instance that owns this renderer.
     * @param {ServerWrapper} ServerWrapper the wrapped internal server object.
     * @param {String} stage The stage of server initialization to modify on. See ../server.js.
     */

  }, {
    key: 'modifyServer',
    value: function modifyServer(Prerenderer, ServerWrapper, stage) {
      var _this = this;

      var rootOptions = Prerenderer.getOptions();
      var rendererOptions = this._rendererOptions;

      if (stage === 'pre-fallback') {
        ServerWrapper._expressServer.get('*', function (req, res, next) {
          try {
            // TODO: May not be robust enough. I'm lazy and used readFileSync... Sorry.
            var file = fs.readFileSync(rootOptions.indexPath ? rootOptions.indexPath : path.join(rootOptions.staticDir, 'index.html'), 'utf-8');

            // Process the page with cheerio. (Hopefully won't cause things to break.)
            var $ = cheerio.load(file);

            var hasScript = $('script').length > 0;

            // Separate function for injecting an object into the page.
            var injectScript = rendererOptions.inject ? `(function () { window['${rendererOptions.injectProperty}'] = ${JSON.stringify(rendererOptions.inject)}; })();` : '';

            // This handles rendering and communicating back to the server.
            var rendererScript = $(`
            <script type="text/javascript" id="${rendererOptions.injectedScriptId}">
              (function() {
                ${injectScript}

                // Remove script from the DOM before rendering anything.
                const scriptElement = window['${rendererOptions.injectedScriptId}']
                // removeNode for IE support.
                scriptElement.remove ? scriptElement.remove() : scriptElement.removeNode(true)

                const getPageContents = (${getPageContents});
                // May not be reliable...
                const originalRoute = window.location.pathname

                document.addEventListener('DOMContentLoaded', function() {
                  getPageContents(${JSON.stringify(rendererOptions)}, ${JSON.stringify(rootOptions)}, originalRoute);
                });
              })()
            </script>
          `.trim());

            // Inject before the first script element or at the end of the head element.
            if (hasScript) {
              rendererScript.insertBefore('script');
            } else {
              rendererScript.appendTo('head');
            }

            res.send($.html());
          } catch (e) {
            console.error(e);
            next();
          }
        });

        ServerWrapper._expressServer.post('/__prerenderer-browser-route/renderer-completed', bodyParser.json(), function (req, res) {
          try {
            var result = req.body;

            _this._routeEmitter.emit(result.route, result);
            res.sendStatus(200);
          } catch (e) {
            console.error(e);
            res.sendStatus(500);
          }
        });
      }
    }
  }, {
    key: 'initialize',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', Promise.resolve());

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function initialize() {
        return _ref.apply(this, arguments);
      }

      return initialize;
    }()
  }, {
    key: 'renderRoutes',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(routes, Prerenderer) {
        var _this2 = this;

        var limiter, rootOptions;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes);
                rootOptions = Prerenderer.getOptions();
                return _context2.abrupt('return', Promise.all(routes.map(function (route) {
                  return limiter(function () {
                    return opn(`http://localhost:${rootOptions.server.port}${route}`, _extends({ wait: false }, _this2._rendererOptions.opn)).then(function (cp) {
                      return new Promise(function (resolve, reject) {
                        _this2._routeEmitter.on(route, function (result) {
                          cp.kill();
                          resolve(result);
                        });
                      });
                    });
                  });
                })));

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function renderRoutes(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return renderRoutes;
    }()
  }, {
    key: 'destroy',
    value: function destroy() {
      // NOOP
    }
  }]);

  return BrowserRenderer;
}();

module.exports = BrowserRenderer;