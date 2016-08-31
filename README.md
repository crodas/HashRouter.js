# HashRouter.js

Super simple URL dispatcher for single page apps.

## Why?

I wrote some [URL dispatchers](https://github.com/crodas/Dispatcher) for server-side apps in the past. When I started writing single-page apps (with my [API-server](https://github.com/crodas/ApiServer)) I needed a simple way of registering URL routes (to sort-of preserve state in the application after refresh).

All the routes are attached in the hash (`document.location.hash`).


## Installation

### npm/webpack
```bash
npm install --save tiny-hash-router
```

### Bower

```bash
bower install --save HashRouter
```

## How?

```js
var hRouter = new HashRouter.Router;
hRoute.route("foo/bar/:page", function(page) {
  console.error("foo/bar on page", page);
}).name("my_route").setDefault("page", 1);

hRoute.route("list/:table/:page", function(table, page) {
});

hRoute.addFilter('page', function(page) {
    return parseInt(page) >= 1;
});

hRoute.registerListener(); // do the initial route.

console.error(hRoute.url("my_page", 99));
```

Or you can use it directly with WebPack.

```
import Router from 'tiny-
```

The library  will listen to any change in the `document.location.hash`, and any change will trigger the newer action.

## Disclaimer

1. This is a work in progress, and things will be added
2. Things to add in the near future:
  1. Catch-all routes
  2. Events 
    1. Pre-routes
    2. Post-routes
    3. Clean up (after we "leave" a given URL).
  3. Better support for `RegExp`
