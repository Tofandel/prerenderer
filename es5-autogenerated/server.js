'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var Server = function () {
  function Server(Prerenderer) {
    _classCallCheck(this, Server);

    this._prerenderer = Prerenderer;
    this._options = Prerenderer.getOptions();
    this._expressServer = express();
    this._nativeServer = null;

    this._expressServer.use(bodyParser.json({
      limit: '100mb'
    }));

    this._expressServer.use(bodyParser.urlencoded({
      limit: '100mb',
      extended: true,
      parameterLimit: 50000
    }));
  }

  _createClass(Server, [{
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      var server = this._expressServer;

      this._prerenderer.modifyServer(this, 'pre-static');

      server.get('*.*', express.static(this._options.staticDir, {
        dotfiles: 'allow'
      }));

      this._prerenderer.modifyServer(this, 'post-static');

      this._prerenderer.modifyServer(this, 'pre-fallback');

      server.get('*', function (req, res) {
        res.sendFile(_this._options.indexPath ? _this._options.indexPath : path.join(_this._options.staticDir, 'index.html'));
      });

      this._prerenderer.modifyServer(this, 'post-fallback');

      return new Promise(function (resolve, reject) {
        _this._nativeServer = server.listen(_this._options.server.port, function () {
          resolve();
        });
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this._nativeServer.close();
    }
  }]);

  return Server;
}();

module.exports = Server;