function checkFunction(obj) {
    if (!(obj instanceof Function)) {
        throw new Error("callback should be a valid function");
    }
}

class Route {
    constructor(router, url, callback) {
        this.router = router;
        this.url = url;
        this.callback = callback;

        if (url instanceof RegExp) {
            return;
        }

        let vars = {};
        let varPos = [];
        let text = [];
        let parts = url.split(/\/+/g).map((part) => {
            if (part.match(/^:[a-z_][a-z0-9_]*$/i)) {
                vars[part.substr(1)] = {};
                varPos.push(part.substr(1));
                text.push(null);
                return ['/', vars[part.substr(1)]]
            }

            text.push(part);
            return ['/', part];

        });

        this.minLength = text.length;
        this.maxLength = text.length;
        this.filter = {};
        this.url    = url;
        this.parts  = Array.prototype.concat.apply([], parts);
        this.vars   = vars;
        this.varPos = varPos;
        this.text   = text;
        this._preRoute = [];
    }
    preRoute(callback) {
        checkFunction(callback)
        this._preRoute.push(callback)
        return this;
    }
    name(name) {
        this.router.routesByName[name]= this;
        return this;
    }
    setDefault(name, value) {
        if (!this.vars.hasOwnProperty(name)) {
            throw new Error("cannot find variable " + name);
        }
        this.vars[name]['default'] = value;
        return this;
    }
    isCandidate(parts, vars) {
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

    generate(args) {
        var id = 0;
        return this.parts.map((part) => {
            if (typeof part === 'object') {
                let name = this.varPos[id];
                let value = args[id++] || part.default;
                if (!value) {
                    throw new Error("cannot find variable " + part + " in the arguments");
                }
                if (this.router.globalFilter[name] && !this.router.globalFilter[name](value)) {
                    throw new Error(value + " is not a valid " + name);
                }
                return value;
            }

            return part;
        });
    }
}

class Router {
    constructor() {
        this.globalFilter = {};
        this.regex = [];
        this.routes = [];
        this.routesByName = {};
        this.globalFilter = {};
    }

    run(url = document.location.hash.substr(1)) {
        var parts = url.split(/\/+/g).filter((part) => { return part.length > 0; });
        var vars;
        for (let i = 0; i < this.routes.length; ++i) {
            vars = [];
            if (!this.routes[i].isCandidate(parts, vars)) {
                continue;
            }

            return this.routes[i].callback.apply(null, vars);
        }

        for (let i = 0; i < this.regex.length; ++i) {
            if (url.match(this.regex[i].url)) {
                return this.regex[i].callback.apply(null, vars);
            }
        }

    }

    registerListener() {
        let doRoute = () => {
            this.run();
        }
        if ("addEventListener" in window) {
            window.addEventListener("hashchange", doRoute, false);
        } else {
            window.onhashchange = doRoute;
        }
        doRoute();
    }

    url(name, ...args) {
        if (!(this.routesByName[name] instanceof Route)) {
            throw new Error("Cannot find " + name + " url");
        }

        return this.routesByName[name].generate(args).join('');
    }

    addFilter(name, callback) {
        checkFunction(callback);
        this.globalFilter[name] = callback;
        return this;
    }

    route(url, callback) {
        let route = new Route(this, url, callback);
        if (url instanceof RegExp) {
            this.regex.push(route);
        } else {
            this.routes.push(route);
        }

        return route;
    }

}

export {Router as default, Router};
