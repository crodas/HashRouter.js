'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function checkFunction(obj) {
    if (!(obj instanceof Function)) {
        throw new Error("callback should be a valid function");
    }
}

var Route = function () {
    function Route(router, url, callback) {
        _classCallCheck(this, Route);

        this.router = router;
        this.url = url;
        this.callback = callback;

        if (url instanceof RegExp) {
            return;
        }

        var vars = {};
        var varPos = [];
        var text = [];
        var parts = url.split(/\/+/g).map(function (part) {
            if (part.match(/^:[a-z_][a-z0-9_]*$/i)) {
                vars[part.substr(1)] = {};
                varPos.push(part.substr(1));
                text.push(null);
                return ['/', vars[part.substr(1)]];
            }

            text.push(part);
            return ['/', part];
        });

        this.minLength = text.length;
        this.maxLength = text.length;
        this.filter = {};
        this.url = url;
        this.parts = Array.prototype.concat.apply([], parts);
        this.vars = vars;
        this.varPos = varPos;
        this.text = text;
        this._preRoute = [];
    }

    _createClass(Route, [{
        key: 'preRoute',
        value: function preRoute(callback) {
            checkFunction(callback);
            this._preRoute.push(callback);
            return this;
        }
    }, {
        key: 'name',
        value: function name(_name) {
            this.router.routesByName[_name] = this;
            return this;
        }
    }, {
        key: 'setDefault',
        value: function setDefault(name, value) {
            if (!this.vars.hasOwnProperty(name)) {
                throw new Error("cannot find variable " + name);
            }
            this.vars[name]['default'] = value;
            return this;
        }
    }, {
        key: 'isCandidate',
        value: function isCandidate(parts, vars) {
            var i,
                e,
                x = 0,
                zvar;

            // Mininum length?
            if (this.minLength > parts.length || this.maxLength < parts.length) {
                return false;
            }

            // Fail sooner, check all the static content (no placeholders/variables)
            for (i = 0, e = 0; i < parts.length && e < this.text.length; ++e, ++i) {
                if (this.text[e] !== null && parts[i] !== this.text[e]) {
                    return false;
                }
            }

            // check all the variables and their filters/validators
            for (i = 0, e = 0; i < parts.length && e < this.text.length; ++e, ++i) {
                if (this.text[e] === null) {
                    zvar = this.varPos[x++];
                    if (this.filter[zvar] && !this.filter[zvar](parts[e])) {
                        return false;
                    } else if (this.router.globalFilter[zvar] && !this.router.globalFilter[zvar](parts[e])) {
                        return false;
                    }
                    vars.push(parts[e]);
                }
            }

            for (var i = 0; i < this._preRoute.length; ++i) {
                if (this._preRoute[i]() === false) {
                    return false;
                }
            }

            return true;
        }
    }, {
        key: 'generate',
        value: function generate(args) {
            var _this = this;

            var id = 0;
            return this.parts.map(function (part) {
                if ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object') {
                    var name = _this.varPos[id];
                    var value = args[id++] || part.default;
                    if (!value) {
                        throw new Error("cannot find variable " + part + " in the arguments");
                    }
                    if (_this.router.globalFilter[name] && !_this.router.globalFilter[name](value)) {
                        throw new Error(value + " is not a valid " + name);
                    }
                    return value;
                }

                return part;
            });
        }
    }]);

    return Route;
}();

var Router = function () {
    function Router() {
        _classCallCheck(this, Router);

        this.globalFilter = {};
        this.regex = [];
        this.routes = [];
        this.routesByName = {};
        this.globalFilter = {};
    }

    _createClass(Router, [{
        key: 'run',
        value: function run() {
            var url = arguments.length <= 0 || arguments[0] === undefined ? document.location.hash.substr(1) : arguments[0];

            var parts = url.split(/\/+/g).filter(function (part) {
                return part.length > 0;
            });
            var vars;
            for (var i = 0; i < this.routes.length; ++i) {
                vars = [];
                if (!this.routes[i].isCandidate(parts, vars)) {
                    continue;
                }

                return this.routes[i].callback.apply(null, vars);
            }

            for (var _i = 0; _i < this.regex.length; ++_i) {
                if (url.match(this.regex[_i].url)) {
                    return this.regex[_i].callback.apply(null, vars);
                }
            }
        }
    }, {
        key: 'registerListener',
        value: function registerListener() {
            var _this2 = this;

            var doRoute = function doRoute() {
                _this2.run();
            };
            if ("addEventListener" in window) {
                window.addEventListener("hashchange", doRoute, false);
            } else {
                window.onhashchange = doRoute;
            }
            doRoute();
        }
    }, {
        key: 'url',
        value: function url(name) {
            if (!(this.routesByName[name] instanceof Route)) {
                throw new Error("Cannot find " + name + " url");
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return this.routesByName[name].generate(args).join('');
        }
    }, {
        key: 'addFilter',
        value: function addFilter(name, callback) {
            checkFunction(callback);
            this.globalFilter[name] = callback;
            return this;
        }
    }, {
        key: 'route',
        value: function route(url, callback) {
            var route = new Route(this, url, callback);
            if (url instanceof RegExp) {
                this.regex.push(route);
            } else {
                this.routes.push(route);
            }

            return route;
        }
    }]);

    return Router;
}();

exports.default = Router;
exports.Router = Router;