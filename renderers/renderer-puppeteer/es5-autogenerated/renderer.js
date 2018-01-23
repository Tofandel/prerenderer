'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var promiseLimit = require('promise-limit');
var puppeteer = require('puppeteer');

var getPageContents = function getPageContents(options, originalRoute) {
  options = options || {};

  return new Promise(function (resolve, reject) {
    function captureDocument() {
      var doctype = new window.XMLSerializer().serializeToString(document.doctype);
      var outerHTML = document.documentElement.outerHTML;

      var result = {
        route: window.location.pathname,
        html: doctype + outerHTML
      };

      return JSON.stringify(result);
    }

    // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
    if (options.renderAfterDocumentEvent) {
      document.addEventListener(options.renderAfterDocumentEvent, function () {
        return resolve(captureDocument());
      });

      // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
    } else if (options.renderAfterElementExists) {
      // TODO: Try and get something MutationObserver-based working.
      setInterval(function () {
        if (document.querySelector(options.renderAfterElementExists)) resolve(captureDocument());
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

var PuppeteerRenderer = function () {
  function PuppeteerRenderer(rendererOptions) {
    _classCallCheck(this, PuppeteerRenderer);

    this._puppeteer = null;
    this._rendererOptions = rendererOptions || {};

    if (this._rendererOptions.maxConcurrentRoutes == null) this._rendererOptions.maxConcurrentRoutes = 0;

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED';
    }
  }

  _createClass(PuppeteerRenderer, [{
    key: 'initialize',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;

                // Workaround for Linux SUID Sandbox issues.
                if (process.platform === 'linux') {
                  if (!this._rendererOptions.args) this._rendererOptions.args = [];

                  if (this._rendererOptions.args.indexOf('--no-sandbox') === -1) {
                    this._rendererOptions.args.push('--no-sandbox');
                    this._rendererOptions.args.push('--disable-setuid-sandbox');
                  }
                }

                _context.next = 4;
                return puppeteer.launch(this._rendererOptions);

              case 4:
                this._puppeteer = _context.sent;
                _context.next = 11;
                break;

              case 7:
                _context.prev = 7;
                _context.t0 = _context['catch'](0);

                console.error('[Prerenderer - PuppeteerRenderer] Unable to start Puppeteer');
                // Re-throw the error so it can be handled further up the chain. Good idea or not?
                throw _context.t0;

              case 11:
                return _context.abrupt('return', this._puppeteer);

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 7]]);
      }));

      function initialize() {
        return _ref.apply(this, arguments);
      }

      return initialize;
    }()
  }, {
    key: 'renderRoutes',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3(routes, Prerenderer) {
        var _this = this;

        var rootOptions, options, limiter, pagePromises;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                rootOptions = Prerenderer.getOptions();
                options = this._rendererOptions;
                limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes);
                pagePromises = Promise.all(routes.map(function (route, index) {
                  return limiter(_asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                    var page, result, parsedResult;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return _this._puppeteer.newPage();

                          case 2:
                            page = _context2.sent;

                            if (!options.inject) {
                              _context2.next = 6;
                              break;
                            }

                            _context2.next = 6;
                            return page.evaluateOnNewDocument(`(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`);

                          case 6:
                            _context2.next = 8;
                            return page.goto(`http://localhost:${rootOptions.server.port}${route}`);

                          case 8:
                            _context2.next = 10;
                            return page.evaluate(getPageContents, _this._rendererOptions, route);

                          case 10:
                            result = _context2.sent;
                            parsedResult = JSON.parse(result);

                            parsedResult.originalRoute = route;

                            _context2.next = 15;
                            return page.close();

                          case 15:
                            return _context2.abrupt('return', Promise.resolve(parsedResult));

                          case 16:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this);
                  })));
                }));
                return _context3.abrupt('return', pagePromises);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function renderRoutes(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return renderRoutes;
    }()
  }, {
    key: 'destroy',
    value: function destroy() {
      this._puppeteer.close();
    }
  }]);

  return PuppeteerRenderer;
}();

module.exports = PuppeteerRenderer;