'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSDOM = require('jsdom/lib/old-api.js').jsdom;
var serializeDocument = require('jsdom/lib/old-api.js').serializeDocument;
var promiseLimit = require('promise-limit');

var shim = function shim(window) {
  window.SVGElement = window.HTMLElement;
  window.localStorage = window.sessionStorage = {

    getItem: function getItem(key) {
      return this[key];
    },

    setItem: function setItem(key, value) {
      this[key] = value;
    }
  };
};

var getPageContents = function getPageContents(window, options, originalRoute) {
  options = options || {};

  return new Promise(function (resolve) {
    var int = void 0;

    function captureDocument() {
      var result = {
        originalRoute: originalRoute,
        route: originalRoute,
        html: serializeDocument(window.document)
      };

      if (int != null) {
        clearInterval(int);
      }

      window.close();
      return result;
    }

    // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
    if (options.renderAfterDocumentEvent) {
      window.document.addEventListener(options.renderAfterDocumentEvent, function () {
        return resolve(captureDocument());
      });

      // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      var doc = window.document;
      int = setInterval(function () {
        if (doc.querySelector(options.renderAfterElementExists)) resolve(captureDocument());
      }, 100);

      // CAPTURE AFTER A NUMBER OF MILLISECONDS
    } else if (options.renderAfterTime) {
      setTimeout(function () {
        return resolve(captureDocument());
      }, options.renderAfterTime);

      // DEFAULT: RUN IMMEDIATELY
    } else {
      resolve(captureDocument());
    }
  });
};

var JSDOMRenderer = function () {
  function JSDOMRenderer(rendererOptions) {
    _classCallCheck(this, JSDOMRenderer);

    this._rendererOptions = rendererOptions || {};

    if (this._rendererOptions.maxConcurrentRoutes == null) this._rendererOptions.maxConcurrentRoutes = 0;

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED';
    }
  }

  _createClass(JSDOMRenderer, [{
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
        var _this = this;

        var rootOptions, limiter;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                rootOptions = Prerenderer.getOptions();
                limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes);
                return _context2.abrupt('return', Promise.all(routes.map(function (route) {
                  return limiter(function () {
                    return new Promise(function (resolve, reject) {
                      JSDOM.env({
                        url: `http://127.0.0.1:${rootOptions.server.port}${route}`,
                        features: {
                          FetchExternalResources: ['script'],
                          ProcessExternalResources: ['script'],
                          SkipExternalResources: false
                        },
                        created: function created(err, window) {
                          if (err) return reject(err);
                          // Injection / shimming must happen before we resolve with the window,
                          // otherwise the page will finish loading before the injection happens.
                          if (_this._rendererOptions.inject) {
                            window[_this._rendererOptions.injectProperty] = _this._rendererOptions.inject;
                          }

                          window.addEventListener('error', function (event) {
                            console.error(event.error);
                          });

                          shim(window);

                          resolve(window);
                        }
                      });
                    }).then(function (window) {
                      return getPageContents(window, _this._rendererOptions, route);
                    });
                  });
                })).catch(function (e) {
                  console.error(e);
                  return Promise.reject(e);
                }));

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

  return JSDOMRenderer;
}();

module.exports = JSDOMRenderer;