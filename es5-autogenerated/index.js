'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Server = require('./server');
var PortFinder = require('portfinder');
var minify = require('html-minifier').minify;

var PACKAGE_NAME = '[Prerenderer]';

var OPTION_SCHEMA = {
  staticDir: {
    type: String,
    required: true
  },
  indexPath: {
    type: String,
    required: false
  },
  postprocess: {
    type: [Boolean, Object],
    required: false,
    children: {
      minifyHTML: {
        type: [Boolean, Object],
        default: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          decodeEntities: true,
          keepClosingSlash: true,
          sortAttributes: true,
          sortClassName: false
        }
      },
      minifyCSS: {
        type: [Boolean, Object],
        default: {}
      },
      HTTP2PushManifest: {
        type: Boolean,
        default: true
      },
      PreconnectThirdParty: {
        type: Boolean,
        default: false
      }
    }
  }
};

function validateOptionsSchema(schema, options, parent) {
  var errors = [];

  Object.keys(schema).forEach(function (key) {
    // Required options
    if (schema[key].required && !options[key]) {
      errors.push(`"${parent || ''}${key}" option is required!`);
      return;
      // Options with default values or potential childre.
    } else if (!options[key] && (schema[key].default || schema[key].children)) {
      options[key] = schema[key].default != null ? schema[key].default : {};
      // Non-required empty options.
    } else if (!options[key]) return;

    // Array-type options
    if (Array.isArray(schema[key].type) && schema[key].type.indexOf(options[key].constructor) === -1) {
      console.log(schema[key].type.indexOf(options[key].constructor));
      errors.push(`"${parent || ''}${key}" option must be a ${schema[key].type.map(function (t) {
        return t.name;
      }).join(' or ')}!`);
      // Single-type options.
    } else if (!Array.isArray(schema[key].type) && options[key].constructor !== schema[key].type) {
      errors.push(`"${parent || ''}${key}" option must be a ${schema[key].type.name}!`);
      return;
    }

    if (schema[key].children) {
      errors.push.apply(errors, _toConsumableArray(validateOptionsSchema(schema[key].children, options[key], key)));
      return;
    }
  });

  errors.forEach(function (error) {
    console.error(`${PACKAGE_NAME} ${error}`);
  });

  return errors;
}

var Prerenderer = function () {
  function Prerenderer(options) {
    _classCallCheck(this, Prerenderer);

    this._options = options || {};

    this._server = new Server(this);
    this._renderer = options.renderer;

    if (this._renderer && this._renderer.preServer) this._renderer.preServer(this);

    if (!this._options) throw new Error(`${PACKAGE_NAME} Options must be defined!`);

    if (!this._options.renderer) {
      throw new Error(`${PACKAGE_NAME} No renderer was passed to prerenderer.
If you are not sure wihch renderer to use, see the documentation at https://github.com/tribex/prerenderer.`);
    }

    var optionValidationErrors = validateOptionsSchema(OPTION_SCHEMA, this._options);

    if (optionValidationErrors.length !== 0) throw new Error(`${PACKAGE_NAME} Options are invalid. Unable to prerender!`);
  }

  _createClass(Prerenderer, [{
    key: 'initialize',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
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
    key: 'postProcess',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(renderedRoutes) {
        var _this = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this._options.postprocess.minifyHTML) {
                  if (this._options.postprocess.minifyHTML.constructor === Boolean) {
                    this._options.postprocess.minifyHTML = OPTION_SCHEMA.postprocess.children.minifyHTML.default;
                  }

                  this._options.postprocess.minifyHTML.minifyCSS = this._options.postprocess.minifyCSS;

                  renderedRoutes = renderedRoutes.map(function (route) {
                    route.html = minify(route.html, _this._options.postprocess.minifyHTML);
                    return route;
                  });
                }

                return _context2.abrupt('return', renderedRoutes);

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function postProcess(_x) {
        return _ref2.apply(this, arguments);
      }

      return postProcess;
    }()
  }, {
    key: 'renderRoutes',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3(routes) {
        var renderedRoutes;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._renderer.renderRoutes(routes, this);

              case 2:
                renderedRoutes = _context3.sent;

                if (!(this._options.postprocess !== false)) {
                  _context3.next = 7;
                  break;
                }

                _context3.next = 6;
                return this.postProcess(renderedRoutes);

              case 6:
                renderedRoutes = _context3.sent;

              case 7:
                return _context3.abrupt('return', renderedRoutes);

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function renderRoutes(_x2) {
        return _ref3.apply(this, arguments);
      }

      return renderRoutes;
    }()
  }]);

  return Prerenderer;
}();

module.exports = Prerenderer;