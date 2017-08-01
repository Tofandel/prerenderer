'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Server = require('./server');
var ChromeRenderer = require('./renderers/chrome');
var JSDOMRenderer = require('./renderers/jsdom');
var BrowserRenderer = require('./renderers/browser');

var PortFinder = require('portfinder');

var PackageName = '[Prerenderer]';

function validateOptions(options) {
  var stringTypes = ['staticDir', 'indexPath', 'injectName'];

  if (!options) throw new Error(`${PackageName} Options must be defined!`);

  if (!options.staticDir) throw new Error(`${PackageName} Unable to prerender. No "staticDir" was defined.`);
  if (typeof options.staticDir !== 'string') throw new TypeError(`${PackageName} Unable to prerender. "staticDir" must be a string.`);

  stringTypes.forEach(function (type) {
    if (options[type] && typeof options[type] !== 'string') throw new TypeError(`${PackageName} Unable to prerender. "${type}" must be a string.`);
  });

  return true;
}

var Prerenderer = function () {
  function Prerenderer(options) {
    _classCallCheck(this, Prerenderer);

    this._options = options || {};

    this._server = new Server(this);
    this._renderer = options.renderer && typeof options.renderer.initialize === 'function' ? options.renderer : new BrowserRenderer(options.renderer || {});

    if (this._renderer.preServer) this._renderer.preServer(this);

    validateOptions(this._options);
  }

  _createClass(Prerenderer, [{
    key: 'initialize',
    value: function () {
      var _ref = _asyncToGenerator(_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.t1 = this._options.server.port;

                if (_context.t1) {
                  _context.next = 5;
                  break;
                }

                _context.next = 4;
                return PortFinder.getPortPromise();

              case 4:
                _context.t1 = _context.sent;

              case 5:
                _context.t0 = _context.t1;

                if (_context.t0) {
                  _context.next = 8;
                  break;
                }

                _context.t0 = 13010;

              case 8:
                this._options.server.port = _context.t0;
                _context.next = 11;
                return this._server.initialize();

              case 11:
                _context.next = 13;
                return this._renderer.initialize();

              case 13:
                return _context.abrupt('return', Promise.resolve());

              case 14:
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
    key: 'destroy',
    value: function destroy() {
      this._renderer.destroy();
      this._server.destroy();
    }
  }, {
    key: 'getServer',
    value: function getServer() {
      return this._server;
    }
  }, {
    key: 'getRenderer',
    value: function getRenderer() {
      return this._renderer;
    }
  }, {
    key: 'getOptions',
    value: function getOptions() {
      return this._options;
    }
  }, {
    key: 'modifyServer',
    value: function modifyServer(server, stage) {
      if (this._renderer.modifyServer) this._renderer.modifyServer(this, server, stage);
    }
  }, {
    key: 'renderRoutes',
    value: function renderRoutes(routes) {
      var _this = this;

      return this._renderer.renderRoutes(routes, this).then(function (renderedRoutes) {
        // May break things, regex is really basic. Recommended you leave this disabled.
        if (_this._options.removeWhitespace) {
          renderedRoutes.forEach(function (renderedRoute) {
            renderedRoute.html = renderedRoute.html.split(/>[\s]+</gmi).join('><');
          });
        }

        return renderedRoutes;
      });
    }
  }]);

  return Prerenderer;
}();

Prerenderer.ChromeRenderer = ChromeRenderer;
Prerenderer.JSDOMRenderer = JSDOMRenderer;
Prerenderer.BrowserRenderer = BrowserRenderer;

module.exports = Prerenderer;