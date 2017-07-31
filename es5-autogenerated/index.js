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
    this._server = new Server(this._options);
    this._renderer = options.renderer && typeof options.renderer.initialize === 'function' ? options.renderer : new JSDOMRenderer(options.renderer || {});

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
    key: 'renderRoutes',
    value: function renderRoutes(routes) {
      return this._renderer.renderRoutes(routes, this._options.server.port, this._options);
    }
  }]);

  return Prerenderer;
}();

Prerenderer.ChromeRenderer = ChromeRenderer;
Prerenderer.JSDOMRenderer = JSDOMRenderer;

module.exports = Prerenderer;