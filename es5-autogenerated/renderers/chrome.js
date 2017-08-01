'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var getChromeStartCommand = function () {
  var _ref = _asyncToGenerator(_regenerator2.default.mark(function _callee(platform) {
    var foundValid, promises;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!platformCommands[platform || process.platform]) {
              _context.next = 4;
              break;
            }

            foundValid = false;
            promises = platformCommands[platform || process.platform].map(function (command) {
              return new Promise(function (resolve, reject) {
                // Spawn a new process to attempt to detect if the binary exists.
                var proc = childProcess.exec(`${command} --headless`, function (error) {
                  if (!error && !foundValid) {
                    // Found a valid command.
                    proc.kill();
                    foundValid = true;
                    resolve(command);
                  }

                  resolve(null);
                });
              });
            });
            return _context.abrupt('return', Promise.all(promises).then(function (result) {
              var command = result.find(function (r) {
                return !!r;
              });
              console.info(`Found Valid Chrome Binary: ${command}`);

              return command;
            }));

          case 4:

            Promise.resolve(null);

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getChromeStartCommand(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Attempts to spawn a chrome renderer process using child_process.spawn. Retries up to five times.
 *
 * @param
 * @returns
 */


var createRenderProcess = function () {
  var _ref2 = _asyncToGenerator(_regenerator2.default.mark(function _callee2(processArgs, renderPort, maxRetries) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', new Promise(function (resolve, reject) {
              var proc = childProcess.spawn(processArgs[0], processArgs.slice(1), { maxBuffer: 1048576 });

              var hasPort = false;

              proc.on('close', function () {
                if (hasPort === true) return;

                if (maxRetries <= 0) {
                  reject(new Error('[PrerenderChromePlugin] Unable to start Chrome. No more retries. (You should probably set the browserCommand option.)'));
                  return;
                }

                maxRetries--;

                createRenderProcess(processArgs, renderPort, maxRetries).then(function (proc) {
                  return resolve(proc);
                });
              });

              if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'development') {
                proc.stdout.on('data', function (d) {
                  console.info(`Chrome STDOUT: ${d}`);
                });

                proc.stderr.on('data', function (d) {
                  console.error(`Chrome STDERR: ${d}`);
                });
              }

              waitPort({
                host: 'localhost',
                port: renderPort
              }).then(function (portDetected) {
                hasPort = portDetected;
                resolve(proc);
              });
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function createRenderProcess(_x2, _x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var prepareTab = function () {
  var _ref3 = _asyncToGenerator(_regenerator2.default.mark(function _callee4(connectionOptions, url, options) {
    var _this = this;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt('return', new Promise(function () {
              var _ref4 = _asyncToGenerator(_regenerator2.default.mark(function _callee3(resolve, reject) {
                var tab, client, Page;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return CRI.New(connectionOptions);

                      case 2:
                        tab = _context3.sent;
                        _context3.next = 5;
                        return CRI(Object.assign({}, connectionOptions, { tab }));

                      case 5:
                        client = _context3.sent;
                        Page = client.Page;
                        _context3.next = 9;
                        return Page.enable();

                      case 9:
                        if (!options.inject) {
                          _context3.next = 19;
                          break;
                        }

                        _context3.prev = 10;
                        _context3.next = 13;
                        return Page.addScriptToEvaluateOnNewDocument({
                          source: `(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`
                        });

                      case 13:
                        _context3.next = 19;
                        break;

                      case 15:
                        _context3.prev = 15;
                        _context3.t0 = _context3['catch'](10);
                        _context3.next = 19;
                        return Page.addScriptToEvaluateOnLoad({
                          scriptSource: `(function () { window['${options.injectProperty}'] = ${JSON.stringify(options.inject)}; })();`
                        });

                      case 19:

                        Page.domContentEventFired(function () {
                          resolve({ client, tab });
                        });

                        _context3.next = 22;
                        return Page.navigate({ url });

                      case 22:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this, [[10, 15]]);
              }));

              return function (_x8, _x9) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 1:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function prepareTab(_x5, _x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var childProcess = require('child_process');
var waitPort = require('wait-port');
var CRI = require('chrome-remote-interface');
var PortFinder = require('portfinder');

var platformCommands = {
  darwin: ['open -a "Google Chrome"'],
  win32: ['start chrome'],
  linux: ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']

  /**
   * Attempts to find a valid instance of chrome on the user's system by guessing commands and seeing if any work. Really hacky.
   * It's much preferred that you set the browserCommand option instead.
   *
   * @param {String} platform An optional platform name to look for. Mostly used for testing.
   * @returns {Promise<string>} The command used to launch chrome.
   */
};

var getPageContents = function getPageContents(options, originalRoute) {
  options = options || {};

  return new Promise(function (resolve, reject) {
    function captureDocument() {
      var doctype = new window.XMLSerializer().serializeToString(document.doctype);
      var outerHTML = document.documentElement.outerHTML;

      var result = {
        route: originalRoute,
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

var ChromeRenderer = function () {
  function ChromeRenderer(rendererOptions) {
    _classCallCheck(this, ChromeRenderer);

    this._browserProcess = null;
    this._command = null;
    this._rendererOptions = rendererOptions || {};

    if (this._rendererOptions.inject && !this._rendererOptions.injectProperty) {
      this._rendererOptions.injectProperty = '__PRERENDER_INJECTED';
    }
  }

  _createClass(ChromeRenderer, [{
    key: 'initialize',
    value: function () {
      var _ref5 = _asyncToGenerator(_regenerator2.default.mark(function _callee5() {
        var _this2 = this;

        var splitCommand, rendererPort, maxLaunchRetries, processArguments;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = this._rendererOptions.command;

                if (_context5.t0) {
                  _context5.next = 5;
                  break;
                }

                _context5.next = 4;
                return getChromeStartCommand();

              case 4:
                _context5.t0 = _context5.sent;

              case 5:
                this._command = _context5.t0;
                splitCommand = this._command ? this._command.split(' ') : null;
                _context5.t2 = this._rendererOptions.port;

                if (_context5.t2) {
                  _context5.next = 12;
                  break;
                }

                _context5.next = 11;
                return PortFinder.getPortPromise();

              case 11:
                _context5.t2 = _context5.sent;

              case 12:
                _context5.t1 = _context5.t2;

                if (_context5.t1) {
                  _context5.next = 15;
                  break;
                }

                _context5.t1 = 13020;

              case 15:
                rendererPort = this._rendererOptions.port = _context5.t1;
                maxLaunchRetries = this._rendererOptions.maxLaunchRetries || 5;

                if (splitCommand) {
                  _context5.next = 19;
                  break;
                }

                return _context5.abrupt('return', Promise.reject('[PrerenderChromePlugin] Unable to start Chrome. (You should probably set the browserCommand option.)'));

              case 19:
                processArguments = [].concat(_toConsumableArray(splitCommand), ['--headless', `--remote-debugging-port=${rendererPort}`]);


                if (this._rendererOptions.arguments) {
                  processArguments.unshift(this._rendererOptions.arguments);
                }

                return _context5.abrupt('return', createRenderProcess(processArguments, rendererPort, maxLaunchRetries).then(function (browserProcess) {
                  _this2._browserProcess = browserProcess;
                  return browserProcess;
                }));

              case 22:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function initialize() {
        return _ref5.apply(this, arguments);
      }

      return initialize;
    }()
  }, {
    key: 'renderRoutes',
    value: function () {
      var _ref6 = _asyncToGenerator(_regenerator2.default.mark(function _callee7(routes, Prerenderer) {
        var _this3 = this;

        var rootOptions, connectionOptions, handlers, handlerPromises;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                rootOptions = Prerenderer.getOptions();
                connectionOptions = {
                  host: '127.0.0.1',
                  port: this._rendererOptions.port
                };
                _context7.next = 4;
                return Promise.all(routes.map(function (route) {
                  return prepareTab(connectionOptions, `http://localhost:${rootOptions.server.port}${route}`, _this3._rendererOptions);
                }));

              case 4:
                handlers = _context7.sent;
                handlerPromises = Promise.all(handlers.map(function () {
                  var _ref7 = _asyncToGenerator(_regenerator2.default.mark(function _callee6(handler, index) {
                    var client, tab, Runtime, _ref8, result, parsedResult;

                    return _regenerator2.default.wrap(function _callee6$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            client = handler.client, tab = handler.tab;
                            Runtime = client.Runtime;
                            _context6.next = 4;
                            return CRI.Activate(Object.assign({}, connectionOptions, { id: tab.id }));

                          case 4:
                            _context6.next = 6;
                            return Runtime.evaluate({
                              expression: `(${getPageContents})(${JSON.stringify(_this3._rendererOptions)}, ${routes[index]})`,
                              awaitPromise: true
                            });

                          case 6:
                            _ref8 = _context6.sent;
                            result = _ref8.result;
                            parsedResult = JSON.parse(result.value);
                            _context6.next = 11;
                            return client.close();

                          case 11:
                            return _context6.abrupt('return', Promise.resolve(parsedResult));

                          case 12:
                          case 'end':
                            return _context6.stop();
                        }
                      }
                    }, _callee6, _this3);
                  }));

                  return function (_x12, _x13) {
                    return _ref7.apply(this, arguments);
                  };
                }())).catch(function (e) {
                  handlers.forEach(function (handler) {
                    handler.client.close();
                  });
                  throw e;
                });
                return _context7.abrupt('return', handlerPromises);

              case 7:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function renderRoutes(_x10, _x11) {
        return _ref6.apply(this, arguments);
      }

      return renderRoutes;
    }()
  }, {
    key: 'destroy',
    value: function destroy() {
      // FIXME: Maybe we should use a more graceful shutdown?
      this._browserProcess.kill();
    }
  }]);

  return ChromeRenderer;
}();

module.exports = ChromeRenderer;