'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var express = require('express');
var path = require('path');

var Server = function () {
  function Server(options) {
    _classCallCheck(this, Server);

    this._options = options;
    this._serverInstance = null;
    this._nativeServer = null;
  }

  _createClass(Server, [{
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      var server = express();
      this._serverInstance = server;

      server.use(express.static(this._options.staticDir, {
        dotfiles: 'allow'
      }));

      server.use('*', function (req, res) {
        res.sendFile(_this._options.indexPath ? _this._options.indexPath : path.join(_this._options.staticDir, 'index.html'));
      });

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