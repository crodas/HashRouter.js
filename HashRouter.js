var HashRouter = (function(window) {
    var ns = {};
    var regex  = [];
    var routes = [];
    var routesByName = {};
    var globalFilter = {};

    function Route(url, callback) {
        var vars  = {};
        var varPos = [];
        var text  = [];
        if (url instanceof RegExp) {
            this.url = url;
            this.callback = callback;
            return;
        }

        var parts = url.split(/\/+/g).map(function(part) {
            if (part.match(/^:[a-z_][a-z0-9_]*$/i)) {
                vars[part.substr(1)] = {};
                varPos.push(part.substr(1));
                text.push(null);
                return ['/', vars[part.substr(1)]]
            }

            text.push(part);
            return ['/', part];

        });
        parts[0][0] = "#"; // swap the first / for #.

        this.minLength = text.length;
        this.maxLength = text.length;
        this.filter = {};
        this.url    = url;
        this.parts  = Array.prototype.concat.apply([], parts);
        this.vars   = vars;
        this.varPos = varPos;
        this._preRoute = [];
        this.text   = text;
        this.callback = callback;
    }
    Route.prototype.preRoute = function(callback) {
        checkFunction(callback);
        this._preRoute.push(callback);
        return this;
    };
    Route.prototype.name = function(name) {
        routesByName[name] = this;
        return this;
    }
    Route.prototype.generate = function(args) {
        var id  = 0;
        var varPos = this.varPos;
        return this.parts.map(function(part) {
            if (typeof part === "object") {
                var name  = varPos[id];
                var value = args[id++] || part.default;
                if (!value) {
                    throw new Error("cannot find variable " + part + " in the arguments");
                }
                if (globalFilter[name] && !globalFilter[name](value)) {
                    throw new Error(value + " is not a valid " + name);
                }
                return value;
            }

            return part;
        }).join('');
        return 
    }
    Route.prototype.setDefault = function(name, value) {
        if (!this.vars.hasOwnProperty(name)) {
            throw new Error("cannot find variable " + name);
        }
        this.vars[name]['default'] = value;
        return this;
    }

    Route.prototype.isCandidate = function(parts, vars) {
        var i, e, x = 0, zvar;

        // Mininum length?
        if (this.minLength > parts.length || this.maxLength < parts.length) {
            return false;
        }

        // Fail sooner, check all the static content (no placeholders/variables)
        for (i = 0, e = 0; i < parts.length && e < this.text.length; ++e, ++i ) {
            if (this.text[e] !== null && parts[i] !== this.text[e]) {
                return false;
            }
        }


        // check all the variables and their filters/validators
        for (i = 0, e = 0; i < parts.length && e < this.text.length; ++e, ++i ) {
            if (this.text[e] === null) {
                zvar = this.varPos[x++];
                if (this.filter[zvar] && !this.filter[zvar](parts[e])) {
                    return false;
                } else if (globalFilter[zvar] && !globalFilter[zvar](parts[e])) {
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
    };

    function checkFunction(obj) {
        if (!(obj instanceof Function)) {
            throw new Error("callback should be a valid function");
        }
    }

    function doRoute() {
        var parts = document.location.hash.substr(1).split(/\/+/g);
        var vars;
        for (var i in routes) {
            vars = [];
            if (!routes.hasOwnProperty(i) || !routes[i].isCandidate(parts, vars)) {
                continue;
            }

            return routes[i].callback.apply(null, vars);
        }

        for (var i in regex) {
            if (regex.hasOwnProperty(i) && document.location.href.match(regex[i].url)) {
                return regex[i].callback.apply(null, vars);
            }
        }
    }

    if ("addEventListener" in window) {
        window.addEventListener("hashchange", doRoute, false);
    } else {
        window.onhashchange = doRoute;
    }

    ns.ready = doRoute;

    ns.url = function(name) {
        if (!(routesByName[name] instanceof Route)) {
            throw new Error("Cannot find " + name + " url");
        }

        return routesByName[name].generate(Array.prototype.slice.call(arguments, 1));
    };

    ns.addFilter = function(name, callback) {
        checkFunction(callback);
        globalFilter[name] = callback;
        return this;
    };

    ns.route = function(url, callback) {
        checkFunction(callback);
        var r = new Route(url, callback);
        if (url instanceof RegExp) {
            regex.push(r);
        } else { 
            routes.push(r);
        }

        return r;
    };

    return ns;
})(this);

var hRouter = HashRouter;
