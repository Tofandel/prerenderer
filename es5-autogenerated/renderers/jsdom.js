'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('jsdom'),
    JSDOM = _require.JSDOM;

var getPageContents = function getPageContents(dom, window, options) {
  options = options || {};

  return new Promise(function (resolve, reject) {
    function captureDocument() {
      var result = {
        route: window.location.pathname,
        html: dom.serialize()
      };

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
      // TODO: Try and get something MutationObserver-based working.
      setInterval(function () {
        if (window.documentdocument.querySelector(options.renderAfterElementExists)) resolve(captureDocument());
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

    this._jsdom = null;
    this._rendererOptions = rendererOptions || {};

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED';
    }
  }

  _createClass(JSDOMRenderer, [{
    key: 'initialize',
    value: function () {
      var _ref = _asyncToGenerator(_regenerator2.default.mark(function _callee() {
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
      var _ref2 = _asyncToGenerator(_regenerator2.default.mark(function _callee2(routes, serverPort, rootOptions) {
        var _this = this;

        var results;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                results = Promise.all(routes.map(function (route) {
                  return JSDOM.fromURL(`http://127.0.0.1:${serverPort}${route}`, {
                    runScripts: 'dangerously',
                    resources: 'usable'
                  }).then(function (dom) {
                    if (_this._rendererOptions.inject) {
                      dom.window.eval(`
            (function () { window['${_this._rendererOptions.injectProperty}'] = ${JSON.stringify(_this._rendererOptions.inject)}; })();
          `);
                    }

                    return new Promise(function (resolve, reject) {
                      dom.window.document.addEventListener('DOMContentLoaded', function () {
                        resolve(getPageContents(dom, dom.window, _this._rendererOptions));
                      });
                    });
                  });
                })).catch(function (e) {
                  console.error(e);
                });
                return _context2.abrupt('return', results);

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function renderRoutes(_x, _x2, _x3) {
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