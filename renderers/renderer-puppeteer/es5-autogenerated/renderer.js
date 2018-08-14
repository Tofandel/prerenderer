'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var promiseLimit = require('promise-limit');
var puppeteer = require('puppeteer');

var waitForRender = function waitForRender(options) {
  options = options || {};

  return new Promise(function (resolve, reject) {
    // Render when an event fires on the document.
    if (options.renderAfterDocumentEvent) {
      if (window['__PRERENDER_STATUS'] && window['__PRERENDER_STATUS'].__DOCUMENT_EVENT_RESOLVED) resolve();
      document.addEventListener(options.renderAfterDocumentEvent, function () {
        return resolve();
      });

      // Render after a certain number of milliseconds.
    } else if (options.renderAfterTime) {
      setTimeout(function () {
        return resolve();
      }, options.renderAfterTime);

      // Default: Render immediately after page content loads.
    } else {
      resolve();
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
                _context.next = 12;
                break;

              case 7:
                _context.prev = 7;
                _context.t0 = _context['catch'](0);

                console.error(_context.t0);
                console.error('[Prerenderer - PuppeteerRenderer] Unable to start Puppeteer');
                // Re-throw the error so it can be handled further up the chain. Good idea or not?
                throw _context.t0;

              case 12:
                return _context.abrupt('return', this._puppeteer);

              case 13:
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
    key: 'handleRequestInterception',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(page, baseURL) {
        var _this = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return page.setRequestInterception(true);

              case 2:

                page.on('request', function (req) {
                  // Skip third party requests if needed.
                  if (_this._rendererOptions.skipThirdPartyRequests) {
                    if (!req.url().startsWith(baseURL)) {
                      req.abort();
                      return;
                    }
                  }

                  req.continue();
                });

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function handleRequestInterception(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return handleRequestInterception;
    }()
  }, {
    key: 'renderRoutes',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee4(routes, Prerenderer) {
        var _this2 = this;

        var rootOptions, options, limiter, pagePromises;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                rootOptions = Prerenderer.getOptions();
                options = this._rendererOptions;
                limiter = promiseLimit(this._rendererOptions.maxConcurrentRoutes);
                pagePromises = Promise.all(routes.map(function (route, index) {
                  return limiter(_asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                    var page, baseURL, navigationOptions, renderAfterElementExists, result;
                    return _regenerator2.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            _context3.next = 2;
                            return _this2._puppeteer.newPage();

                          case 2:
                            page = _context3.sent;


                            if (options.consoleHandler) {
                              page.on('console', function (message) {
                                return options.consoleHandler(route, message);
                              });
                            }

                            if (!options.inject) {
                              _context3.next = 7;
                              break;
                            }

                            _context3.next = 7;
                            return page.evaluateOnNewDocument(`(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`);

                          case 7:
                            baseURL = `http://localhost:${rootOptions.server.port}`;

                            // Allow setting viewport widths and such.

                            if (!options.viewport) {
                              _context3.next = 11;
                              break;
                            }

                            _context3.next = 11;
                            return page.setViewport(options.viewport);

                          case 11:
                            _context3.next = 13;
                            return _this2.handleRequestInterception(page, baseURL);

                          case 13:

                            // Hack just in-case the document event fires before our main listener is added.
                            if (options.renderAfterDocumentEvent) {
                              page.evaluateOnNewDocument(function (options) {
                                window['__PRERENDER_STATUS'] = {};
                                document.addEventListener(options.renderAfterDocumentEvent, function () {
                                  window['__PRERENDER_STATUS'].__DOCUMENT_EVENT_RESOLVED = true;
                                });
                              }, _this2._rendererOptions);
                            }

                            navigationOptions = options.navigationOptions ? _extends({ waituntil: 'networkidle0' }, options.navigationOptions) : { waituntil: 'networkidle0' };
                            _context3.next = 17;
                            return page.goto(`${baseURL}${route}`, navigationOptions);

                          case 17:

                            // Wait for some specific element exists
                            renderAfterElementExists = _this2._rendererOptions.renderAfterElementExists;

                            if (!(renderAfterElementExists && typeof renderAfterElementExists === 'string')) {
                              _context3.next = 21;
                              break;
                            }

                            _context3.next = 21;
                            return page.waitForSelector(renderAfterElementExists);

                          case 21:
                            _context3.next = 23;
                            return page.evaluate(waitForRender, _this2._rendererOptions);

                          case 23:
                            _context3.t0 = route;
                            _context3.next = 26;
                            return page.evaluate('window.location.pathname');

                          case 26:
                            _context3.t1 = _context3.sent;
                            _context3.next = 29;
                            return page.content();

                          case 29:
                            _context3.t2 = _context3.sent;
                            result = {
                              originalRoute: _context3.t0,
                              route: _context3.t1,
                              html: _context3.t2
                            };
                            _context3.next = 33;
                            return page.close();

                          case 33:
                            return _context3.abrupt('return', result);

                          case 34:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this2);
                  })));
                }));
                return _context4.abrupt('return', pagePromises);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function renderRoutes(_x3, _x4) {
        return _ref3.apply(this, arguments);
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