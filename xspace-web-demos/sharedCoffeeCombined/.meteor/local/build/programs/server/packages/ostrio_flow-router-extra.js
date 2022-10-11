(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var ECMAScript = Package.ecmascript.ECMAScript;
var Promise = Package.promise.Promise;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var EJSON = Package.ejson.EJSON;
var check = Package.check.check;
var Match = Package.check.Match;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:flow-router-extra":{"server":{"_init.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/server/_init.js                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.export({
  FlowRouter: () => FlowRouter,
  Router: () => Router,
  Route: () => Route,
  Group: () => Group,
  Triggers: () => Triggers,
  BlazeRenderer: () => BlazeRenderer
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Router;
module.link("./router.js", {
  default(v) {
    Router = v;
  }

}, 1);
let Route;
module.link("./route.js", {
  default(v) {
    Route = v;
  }

}, 2);
let Group;
module.link("./group.js", {
  default(v) {
    Group = v;
  }

}, 3);
module.link("./plugins/fast-render.js");

if (Package['meteorhacks:inject-data']) {
  Meteor._debug('`meteorhacks:inject-data` is deprecated, please remove it and install its successor - `staringatlights:inject-data`');

  Meteor._debug('meteor remove meteorhacks:inject-data');

  Meteor._debug('meteor add staringatlights:inject-data');
}

if (Package['meteorhacks:fast-render']) {
  Meteor._debug('`meteorhacks:fast-render` is deprecated, please remove it and install its successor - `staringatlights:fast-render`');

  Meteor._debug('meteor remove meteorhacks:fast-render');

  Meteor._debug('meteor add staringatlights:fast-render');
}

const Triggers = {};
const BlazeRenderer = {};
const FlowRouter = new Router();
FlowRouter.Router = Router;
FlowRouter.Route = Route;
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"group.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/server/group.js                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let _helpers;

module.link("./../lib/_helpers.js", {
  _helpers(v) {
    _helpers = v;
  }

}, 0);

const makeTrigger = trigger => {
  if (_helpers.isFunction(trigger)) {
    return [trigger];
  } else if (!_helpers.isArray(trigger)) {
    return [];
  }

  return trigger;
};

const makeTriggers = (_base, _triggers) => {
  if (!_base && !_triggers) {
    return [];
  }

  return makeTrigger(_base).concat(makeTrigger(_triggers));
};

class Group {
  constructor(router) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let parent = arguments.length > 2 ? arguments[2] : undefined;

    if (options.prefix && !/^\//.test(options.prefix)) {
      throw new Error('group\'s prefix must start with "/"');
    }

    this._router = router;
    this.prefix = options.prefix || '';
    this.name = options.name;
    this.options = options;
    this._triggersEnter = makeTriggers(options.triggersEnter, this._triggersEnter);
    this._triggersExit = makeTriggers(this._triggersExit, options.triggersExit);
    this._subscriptions = options.subscriptions || Function.prototype;
    this.parent = parent;

    if (this.parent) {
      this.prefix = parent.prefix + this.prefix;
      this._triggersEnter = makeTriggers(parent._triggersEnter, this._triggersEnter);
      this._triggersExit = makeTriggers(this._triggersExit, parent._triggersExit);
    }
  }

  route(_pathDef) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    let _group = arguments.length > 2 ? arguments[2] : undefined;

    if (!/^\//.test(_pathDef)) {
      throw new Error('route\'s path must start with "/"');
    }

    const group = _group || this;
    const pathDef = this.prefix + _pathDef;
    options.triggersEnter = makeTriggers(this._triggersEnter, options.triggersEnter);
    options.triggersExit = makeTriggers(options.triggersExit, this._triggersExit);
    return this._router.route(pathDef, _helpers.extend(_helpers.omit(this.options, ['triggersEnter', 'triggersExit', 'subscriptions', 'prefix', 'waitOn', 'name', 'title', 'titlePrefix', 'link', 'script', 'meta']), options), group);
  }

  group(options) {
    return new Group(this._router, options, this);
  }

}

module.exportDefault(Group);
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"route.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/server/route.js                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
class Route {
  constructor(router, pathDef) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    this.options = options;
    this.name = options.name;
    this.pathDef = pathDef; // Route.path is deprecated and will be removed in 3.0

    this.path = pathDef;
    this.action = options.action || Function.prototype;
    this.subscriptions = options.subscriptions || Function.prototype;
    this._subsMap = {};
  }

  register(name, sub) {
    this._subsMap[name] = sub;
  }

  subscription(name) {
    return this._subsMap[name];
  }

  middleware() {// ?
  }

}

module.exportDefault(Route);
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"router.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/server/router.js                                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let page;
module.link("page", {
  default(v) {
    page = v;
  }

}, 0);
let Route;
module.link("./route.js", {
  default(v) {
    Route = v;
  }

}, 1);
let Group;
module.link("./group.js", {
  default(v) {
    Group = v;
  }

}, 2);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 3);

let _helpers;

module.link("../lib/_helpers.js", {
  _helpers(v) {
    _helpers = v;
  }

}, 4);

const qs = require('qs');

class Router {
  constructor() {
    this.pathRegExp = /(:[\w\(\)\\\+\*\.\?\[\]\-]+)+/g;
    this._routes = [];
    this._routesMap = {};
    this._current = {};
    this._specialChars = ['/', '%', '+'];

    this._encodeParam = param => {
      const paramArr = param.split('');
      let _param = '';

      for (let i = 0; i < paramArr.length; i++) {
        if (this._specialChars.includes(paramArr[i])) {
          _param += encodeURIComponent(encodeURIComponent(paramArr[i]));
        } else {
          try {
            _param += encodeURIComponent(paramArr[i]);
          } catch (e) {
            _param += paramArr[i];
          }
        }
      }

      return _param;
    };

    this.subscriptions = Function.prototype; // holds onRoute callbacks

    this._onRouteCallbacks = [];
    this.triggers = {
      enter() {// client only
      },

      exit() {// client only
      }

    };
  }

  matchPath(path) {
    const params = {};

    const route = this._routes.find(r => {
      const pageRoute = new page.Route(r.pathDef);
      return pageRoute.match(path, params);
    });

    if (!route) {
      return null;
    }

    return {
      params: _helpers.clone(params),
      route: _helpers.clone(route)
    };
  }

  setCurrent(current) {
    this._current = current;
  }

  route(pathDef) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!/^\/.*/.test(pathDef) && pathDef !== '*') {
      throw new Error('route\'s path must start with "/"');
    }

    const route = new Route(this, pathDef, options);

    this._routes.push(route);

    if (options.name) {
      this._routesMap[options.name] = route;
    }

    this._triggerRouteRegister(route);

    return route;
  }

  group(options) {
    return new Group(this, options);
  }

  path(_pathDef) {
    let fields = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let queryParams = arguments.length > 2 ? arguments[2] : undefined;
    let pathDef = _pathDef;

    if (this._routesMap[pathDef]) {
      pathDef = this._routesMap[pathDef].path;
    }

    let path = pathDef.replace(this.pathRegExp, _key => {
      const firstRegexpChar = _key.indexOf('('); // get the content behind : and (\\d+/)


      let key = _key.substring(1, firstRegexpChar > 0 ? firstRegexpChar : undefined); // remove +?*


      key = key.replace(/[\+\*\?]+/g, '');

      if (fields[key]) {
        return this._encodeParam("".concat(fields[key]));
      }

      return '';
    });
    path = path.replace(/\/\/+/g, '/'); // Replace multiple slashes with single slash
    // remove trailing slash
    // but keep the root slash if it's the only one

    path = path.match(/^\/{1}$/) ? path : path.replace(/\/$/, '');
    const strQueryParams = qs.stringify(queryParams || {});

    if (strQueryParams) {
      path += "?".concat(strQueryParams);
    }

    return path;
  }

  onRouteRegister(cb) {
    this._onRouteCallbacks.push(cb);
  }

  _triggerRouteRegister(currentRoute) {
    // We should only need to send a safe set of fields on the route
    // object.
    // This is not to hide what's inside the route object, but to show
    // these are the public APIs
    const routePublicApi = _helpers.pick(currentRoute, ['name', 'pathDef', 'path']);

    routePublicApi.options = _helpers.omit(currentRoute.options, ['triggersEnter', 'triggersExit', 'action', 'subscriptions', 'name']);

    this._onRouteCallbacks.forEach(cb => {
      cb(routePublicApi);
    });
  }

  go() {// client only
  }

  current() {
    // client only
    return this._current;
  }

  middleware() {// client only
  }

  getState() {// client only
  }

  getAllStates() {// client only
  }

  getRouteName() {
    return this._current.route ? this._current.route.name : undefined;
  }

  getQueryParam(key) {
    return this._current.query ? this._current.queryParams[key] : undefined;
  }

  setState() {// client only
  }

  setParams() {}

  removeState() {// client only
  }

  clearStates() {// client only
  }

  ready() {// client only
  }

  initialize() {// client only
  }

  wait() {// client only
  }

  url() {
    // We need to remove the leading base path, or "/", as it will be inserted
    // automatically by `Meteor.absoluteUrl` as documented in:
    // http://docs.meteor.com/#/full/meteor_absoluteurl
    return Meteor.absoluteUrl(this.path.apply(this, arguments).replace(new RegExp('^' + ('/' + (this._basePath || '') + '/').replace(/\/\/+/g, '/')), ''));
  }

}

module.exportDefault(Router);
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"plugins":{"fast-render.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/server/plugins/fast-render.js                                  //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);

let _helpers;

module.link("./../../lib/_helpers.js", {
  _helpers(v) {
    _helpers = v;
  }

}, 1);
let FlowRouter;
module.link("../_init.js", {
  FlowRouter(v) {
    FlowRouter = v;
  }

}, 2);

if (!Package['staringatlights:fast-render']) {
  return;
}

const FastRender = Package['staringatlights:fast-render'].FastRender;

const setupFastRender = () => {
  FlowRouter._routes.forEach(route => {
    if (route.pathDef === '*') {
      return;
    }

    FastRender.route(route.pathDef, function (routeParams, path) {
      // anyone using Meteor.subscribe for something else?
      const meteorSubscribe = Meteor.subscribe;

      Meteor.subscribe = function () {
        return Array.from(arguments);
      };

      route._subsMap = {};
      FlowRouter.subscriptions.call(route, path);

      if (route.subscriptions) {
        route.subscriptions(_helpers.omit(routeParams, ['query']), routeParams.query);
      }

      Object.keys(route._subsMap).forEach(key => {
        this.subscribe.apply(this, route._subsMap[key]);
      }); // restore Meteor.subscribe, ... on server side

      Meteor.subscribe = meteorSubscribe;
    });
  });
}; // hack to run after everything else on startup


Meteor.startup(() => {
  Meteor.startup(() => {
    setupFastRender();
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"lib":{"_helpers.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/ostrio_flow-router-extra/lib/_helpers.js                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.export({
  _helpers: () => _helpers
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const _helpers = {
  isEmpty(obj) {
    // 1
    if (obj == null) {
      return true;
    }

    if (this.isArray(obj) || this.isString(obj) || this.isArguments(obj)) {
      return obj.length === 0;
    }

    return Object.keys(obj).length === 0;
  },

  isObject(obj) {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  },

  omit(obj, keys) {
    // 10
    if (!this.isObject(obj)) {
      Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] First argument must be an Object');

      return obj;
    }

    if (!this.isArray(keys)) {
      Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] Second argument must be an Array');

      return obj;
    }

    const copy = this.clone(obj);
    keys.forEach(key => {
      delete copy[key];
    });
    return copy;
  },

  pick(obj, keys) {
    // 2
    if (!this.isObject(obj)) {
      Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] First argument must be an Object');

      return obj;
    }

    if (!this.isArray(keys)) {
      Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] Second argument must be an Array');

      return obj;
    }

    const picked = {};
    keys.forEach(key => {
      picked[key] = obj[key];
    });
    return picked;
  },

  isArray(obj) {
    return Array.isArray(obj);
  },

  extend() {
    for (var _len = arguments.length, objs = new Array(_len), _key = 0; _key < _len; _key++) {
      objs[_key] = arguments[_key];
    }

    // 4
    return Object.assign({}, ...objs);
  },

  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : this.extend(obj);
  }

};
['Arguments', 'Function', 'String', 'RegExp'].forEach(name => {
  _helpers['is' + name] = function (obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
  };
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"page":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/meteor/ostrio_flow-router-extra/node_modules/page/package.json                      //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "page",
  "version": "1.9.0",
  "main": "index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/meteor/ostrio_flow-router-extra/node_modules/page/index.js                          //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"qs":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/meteor/ostrio_flow-router-extra/node_modules/qs/package.json                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "qs",
  "version": "6.5.2",
  "main": "lib/index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/meteor/ostrio_flow-router-extra/node_modules/qs/lib/index.js                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ostrio:flow-router-extra/server/_init.js");

/* Exports */
Package._define("ostrio:flow-router-extra", exports);

})();

//# sourceURL=meteor://💻app/packages/ostrio_flow-router-extra.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhL3NlcnZlci9faW5pdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhL3NlcnZlci9ncm91cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhL3NlcnZlci9yb3V0ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhL3NlcnZlci9yb3V0ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmbG93LXJvdXRlci1leHRyYS9zZXJ2ZXIvcGx1Z2lucy9mYXN0LXJlbmRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhL2xpYi9faGVscGVycy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJGbG93Um91dGVyIiwiUm91dGVyIiwiUm91dGUiLCJHcm91cCIsIlRyaWdnZXJzIiwiQmxhemVSZW5kZXJlciIsIk1ldGVvciIsImxpbmsiLCJ2IiwiZGVmYXVsdCIsIlBhY2thZ2UiLCJfZGVidWciLCJfaGVscGVycyIsIm1ha2VUcmlnZ2VyIiwidHJpZ2dlciIsImlzRnVuY3Rpb24iLCJpc0FycmF5IiwibWFrZVRyaWdnZXJzIiwiX2Jhc2UiLCJfdHJpZ2dlcnMiLCJjb25jYXQiLCJjb25zdHJ1Y3RvciIsInJvdXRlciIsIm9wdGlvbnMiLCJwYXJlbnQiLCJwcmVmaXgiLCJ0ZXN0IiwiRXJyb3IiLCJfcm91dGVyIiwibmFtZSIsIl90cmlnZ2Vyc0VudGVyIiwidHJpZ2dlcnNFbnRlciIsIl90cmlnZ2Vyc0V4aXQiLCJ0cmlnZ2Vyc0V4aXQiLCJfc3Vic2NyaXB0aW9ucyIsInN1YnNjcmlwdGlvbnMiLCJGdW5jdGlvbiIsInByb3RvdHlwZSIsInJvdXRlIiwiX3BhdGhEZWYiLCJfZ3JvdXAiLCJncm91cCIsInBhdGhEZWYiLCJleHRlbmQiLCJvbWl0IiwiZXhwb3J0RGVmYXVsdCIsInBhdGgiLCJhY3Rpb24iLCJfc3Vic01hcCIsInJlZ2lzdGVyIiwic3ViIiwic3Vic2NyaXB0aW9uIiwibWlkZGxld2FyZSIsInBhZ2UiLCJxcyIsInJlcXVpcmUiLCJwYXRoUmVnRXhwIiwiX3JvdXRlcyIsIl9yb3V0ZXNNYXAiLCJfY3VycmVudCIsIl9zcGVjaWFsQ2hhcnMiLCJfZW5jb2RlUGFyYW0iLCJwYXJhbSIsInBhcmFtQXJyIiwic3BsaXQiLCJfcGFyYW0iLCJpIiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJlbmNvZGVVUklDb21wb25lbnQiLCJlIiwiX29uUm91dGVDYWxsYmFja3MiLCJ0cmlnZ2VycyIsImVudGVyIiwiZXhpdCIsIm1hdGNoUGF0aCIsInBhcmFtcyIsImZpbmQiLCJyIiwicGFnZVJvdXRlIiwibWF0Y2giLCJjbG9uZSIsInNldEN1cnJlbnQiLCJjdXJyZW50IiwicHVzaCIsIl90cmlnZ2VyUm91dGVSZWdpc3RlciIsImZpZWxkcyIsInF1ZXJ5UGFyYW1zIiwicmVwbGFjZSIsIl9rZXkiLCJmaXJzdFJlZ2V4cENoYXIiLCJpbmRleE9mIiwia2V5Iiwic3Vic3RyaW5nIiwidW5kZWZpbmVkIiwic3RyUXVlcnlQYXJhbXMiLCJzdHJpbmdpZnkiLCJvblJvdXRlUmVnaXN0ZXIiLCJjYiIsImN1cnJlbnRSb3V0ZSIsInJvdXRlUHVibGljQXBpIiwicGljayIsImZvckVhY2giLCJnbyIsImdldFN0YXRlIiwiZ2V0QWxsU3RhdGVzIiwiZ2V0Um91dGVOYW1lIiwiZ2V0UXVlcnlQYXJhbSIsInF1ZXJ5Iiwic2V0U3RhdGUiLCJzZXRQYXJhbXMiLCJyZW1vdmVTdGF0ZSIsImNsZWFyU3RhdGVzIiwicmVhZHkiLCJpbml0aWFsaXplIiwid2FpdCIsInVybCIsImFic29sdXRlVXJsIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJSZWdFeHAiLCJfYmFzZVBhdGgiLCJGYXN0UmVuZGVyIiwic2V0dXBGYXN0UmVuZGVyIiwicm91dGVQYXJhbXMiLCJtZXRlb3JTdWJzY3JpYmUiLCJzdWJzY3JpYmUiLCJBcnJheSIsImZyb20iLCJjYWxsIiwiT2JqZWN0Iiwia2V5cyIsInN0YXJ0dXAiLCJpc0VtcHR5Iiwib2JqIiwiaXNTdHJpbmciLCJpc0FyZ3VtZW50cyIsImlzT2JqZWN0IiwidHlwZSIsImNvcHkiLCJwaWNrZWQiLCJvYmpzIiwiYXNzaWduIiwic2xpY2UiLCJ0b1N0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxZQUFVLEVBQUMsTUFBSUEsVUFBaEI7QUFBMkJDLFFBQU0sRUFBQyxNQUFJQSxNQUF0QztBQUE2Q0MsT0FBSyxFQUFDLE1BQUlBLEtBQXZEO0FBQTZEQyxPQUFLLEVBQUMsTUFBSUEsS0FBdkU7QUFBNkVDLFVBQVEsRUFBQyxNQUFJQSxRQUExRjtBQUFtR0MsZUFBYSxFQUFDLE1BQUlBO0FBQXJILENBQWQ7QUFBbUosSUFBSUMsTUFBSjtBQUFXUixNQUFNLENBQUNTLElBQVAsQ0FBWSxlQUFaLEVBQTRCO0FBQUNELFFBQU0sQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLFVBQU0sR0FBQ0UsQ0FBUDtBQUFTOztBQUFwQixDQUE1QixFQUFrRCxDQUFsRDtBQUFxRCxJQUFJUCxNQUFKO0FBQVdILE1BQU0sQ0FBQ1MsSUFBUCxDQUFZLGFBQVosRUFBMEI7QUFBQ0UsU0FBTyxDQUFDRCxDQUFELEVBQUc7QUFBQ1AsVUFBTSxHQUFDTyxDQUFQO0FBQVM7O0FBQXJCLENBQTFCLEVBQWlELENBQWpEO0FBQW9ELElBQUlOLEtBQUo7QUFBVUosTUFBTSxDQUFDUyxJQUFQLENBQVksWUFBWixFQUF5QjtBQUFDRSxTQUFPLENBQUNELENBQUQsRUFBRztBQUFDTixTQUFLLEdBQUNNLENBQU47QUFBUTs7QUFBcEIsQ0FBekIsRUFBK0MsQ0FBL0M7QUFBa0QsSUFBSUwsS0FBSjtB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akI7QUFDRCxLQUZEO0FBSUEsV0FBT2dELE1BQVA7QUFDRCxHQW5EYzs7QUFvRGY1SCxTQUFPLENBQUNzSCxHQUFELEVBQU07QUFDWCxXQUFPUCxLQUFLLENBQUMvRyxPQUFOLENBQWNzSCxHQUFkLENBQVA7QUFDRCxHQXREYzs7QUF1RGYzRixRQUFNLEdBQVU7QUFBQSxzQ0FBTmtHLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUFFO0FBQ2hCLFdBQU9YLE1BQU0sQ0FBQ1ksTUFBUCxDQUFjLEVBQWQsRUFBa0IsR0FBR0QsSUFBckIsQ0FBUDtBQUNELEdBekRjOztBQTBEZjVELE9BQUssQ0FBQ3FELEdBQUQsRUFBTTtBQUNULFFBQUksQ0FBQyxLQUFLRyxRQUFMLENBQWNILEdBQWQsQ0FBTCxFQUF5QixPQUFPQSxHQUFQO0FBQ3pCLFdBQU8sS0FBS3RILE9BQUwsQ0FBYXNILEdBQWIsSUFBb0JBLEdBQUcsQ0FBQ1MsS0FBSixFQUFwQixHQUFrQyxLQUFLcEcsTUFBTCxDQUFZMkYsR0FBWixDQUF6QztBQUNEOztBQTdEYyxDQUFqQjtBQWdFQSxDQUFDLFdBQUQsRUFBYyxVQUFkLEVBQTBCLFFBQTFCLEVBQW9DLFFBQXBDLEVBQThDaEMsT0FBOUMsQ0FBdUR6RSxJQUFELElBQVU7QUFDOURqQixVQUFRLENBQUMsT0FBT2lCLElBQVIsQ0FBUixHQUF3QixVQUFVeUcsR0FBVixFQUFlO0FBQ3JDLFdBQU9KLE1BQU0sQ0FBQzdGLFNBQVAsQ0FBaUIyRyxRQUFqQixDQUEwQmYsSUFBMUIsQ0FBK0JLLEdBQS9CLE1BQXdDLGFBQWF6RyxJQUFiLEdBQW9CLEdBQW5FO0FBQ0QsR0FGRDtBQUdELENBSkQsRSIsImZpbGUiOiIvcGFja2FnZXMvb3N0cmlvX2Zsb3ctcm91dGVyLWV4dHJhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgUm91dGVyICAgICBmcm9tICcuL3JvdXRlci5qcyc7XG5pbXBvcnQgUm91dGUgICAgICBmcm9tICcuL3JvdXRlLmpzJztcbmltcG9ydCBHcm91cCAgICAgIGZyb20gJy4vZ3JvdXAuanMnO1xuaW1wb3J0ICcuL3BsdWdpbnMvZmFzdC1yZW5kZXIuanMnO1xuXG5pZiAoUGFja2FnZVsnbWV0ZW9yaGFja3M6aW5qZWN0LWRhdGEnXSkge1xuICBNZXRlb3IuX2RlYnVnKCdgbWV0ZW9yaGFja3M6aW5qZWN0LWRhdGFgIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSByZW1vdmUgaXQgYW5kIGluc3RhbGwgaXRzIHN1Y2Nlc3NvciAtIGBzdGFyaW5nYXRsaWdodHM6aW5qZWN0LWRhdGFgJyk7XG4gIE1ldGVvci5fZGVidWcoJ21ldGVvciByZW1vdmUgbWV0ZW9yaGFja3M6aW5qZWN0LWRhdGEnKTtcbiAgTWV0ZW9yLl9kZWJ1ZygnbWV0ZW9yIGFkZCBzdGFyaW5nYXRsaWdodHM6aW5qZWN0LWRhdGEnKTtcbn1cblxuaWYgKFBhY2thZ2VbJ21ldGVvcmhhY2tzOmZhc3QtcmVuZGVyJ10pIHtcbiAgTWV0ZW9yLl9kZWJ1ZygnYG1ldGVvcmhhY2tzOmZhc3QtcmVuZGVyYCBpcyBkZXByZWNhdGVkLCBwbGVhc2UgcmVtb3ZlIGl0IGFuZCBpbnN0YWxsIGl0cyBzdWNjZXNzb3IgLSBgc3RhcmluZ2F0bGlnaHRzOmZhc3QtcmVuZGVyYCcpO1xuICBNZXRlb3IuX2RlYnVnKCdtZXRlb3IgcmVtb3ZlIG1ldGVvcmhhY2tzOmZhc3QtcmVuZGVyJyk7XG4gIE1ldGVvci5fZGVidWcoJ21ldGVvciBhZGQgc3RhcmluZ2F0bGlnaHRzOmZhc3QtcmVuZGVyJyk7XG59XG5cbmNvbnN0IFRyaWdnZXJzID0ge307XG5jb25zdCBCbGF6ZVJlbmRlcmVyID0ge307XG5cbmNvbnN0IEZsb3dSb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5GbG93Um91dGVyLlJvdXRlciA9IFJvdXRlcjtcbkZsb3dSb3V0ZXIuUm91dGUgPSBSb3V0ZTtcblxuZXhwb3J0IHsgRmxvd1JvdXRlciwgUm91dGVyLCBSb3V0ZSwgR3JvdXAsIFRyaWdnZXJzLCBCbGF6ZVJlbmRlcmVyIH07XG4iLCJpbXBvcnQgeyBfaGVscGVycyB9IGZyb20gJy4vLi4vbGliL19oZWxwZXJzLmpzJztcblxuY29uc3QgbWFrZVRyaWdnZXIgPSAodHJpZ2dlcikgPT4ge1xuICBpZiAoX2hlbHBlcnMuaXNGdW5jdGlvbih0cmlnZ2VyKSkge1xuICAgIHJldHVybiBbdHJpZ2dlcl07XG4gIH0gZWxzZSBpZiAoIV9oZWxwZXJzLmlzQXJyYXkodHJpZ2dlcikpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gdHJpZ2dlcjtcbn07XG5cbmNvbnN0IG1ha2VUcmlnZ2VycyA9IChfYmFzZSwgX3RyaWdnZXJzKSA9PiB7XG4gIGlmICgoIV9iYXNlICYmICFfdHJpZ2dlcnMpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBtYWtlVHJpZ2dlcihfYmFzZSkuY29uY2F0KG1ha2VUcmlnZ2VyKF90cmlnZ2VycykpO1xufTtcblxuY2xhc3MgR3JvdXAge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIG9wdGlvbnMgPSB7fSwgcGFyZW50KSB7XG4gICAgaWYgKG9wdGlvbnMucHJlZml4ICYmICEvXlxcLy8udGVzdChvcHRpb25zLnByZWZpeCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZ3JvdXBcXCdzIHByZWZpeCBtdXN0IHN0YXJ0IHdpdGggXCIvXCInKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCAnJztcbiAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIHRoaXMuX3RyaWdnZXJzRW50ZXIgPSBtYWtlVHJpZ2dlcnMob3B0aW9ucy50cmlnZ2Vyc0VudGVyLCB0aGlzLl90cmlnZ2Vyc0VudGVyKTtcbiAgICB0aGlzLl90cmlnZ2Vyc0V4aXQgID0gbWFrZVRyaWdnZXJzKHRoaXMuX3RyaWdnZXJzRXhpdCwgb3B0aW9ucy50cmlnZ2Vyc0V4aXQpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG9wdGlvbnMuc3Vic2NyaXB0aW9ucyB8fCBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgIHRoaXMucHJlZml4ID0gcGFyZW50LnByZWZpeCArIHRoaXMucHJlZml4O1xuICAgICAgdGhpcy5fdHJpZ2dlcnNFbnRlciA9IG1ha2VUcmlnZ2VycyhwYXJlbnQuX3RyaWdnZXJzRW50ZXIsIHRoaXMuX3RyaWdnZXJzRW50ZXIpO1xuICAgICAgdGhpcy5fdHJpZ2dlcnNFeGl0ICA9IG1ha2VUcmlnZ2Vycyh0aGlzLl90cmlnZ2Vyc0V4aXQsIHBhcmVudC5fdHJpZ2dlcnNFeGl0KTtcbiAgICB9XG4gIH1cblxuICByb3V0ZShfcGF0aERlZiwgb3B0aW9ucyA9IHt9LCBfZ3JvdXApIHtcbiAgICBpZiAoIS9eXFwvLy50ZXN0KF9wYXRoRGVmKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyb3V0ZVxcJ3MgcGF0aCBtdXN0IHN0YXJ0IHdpdGggXCIvXCInKTtcbiAgICB9XG5cbiAgICBjb25zdCBncm91cCAgID0gX2dyb3VwIHx8IHRoaXM7XG4gICAgY29uc3QgcGF0aERlZiA9IHRoaXMucHJlZml4ICsgX3BhdGhEZWY7XG5cbiAgICBvcHRpb25zLnRyaWdnZXJzRW50ZXIgPSBtYWtlVHJpZ2dlcnModGhpcy5fdHJpZ2dlcnNFbnRlciwgb3B0aW9ucy50cmlnZ2Vyc0VudGVyKTtcbiAgICBvcHRpb25zLnRyaWdnZXJzRXhpdCAgPSBtYWtlVHJpZ2dlcnMob3B0aW9ucy50cmlnZ2Vyc0V4aXQsIHRoaXMuX3RyaWdnZXJzRXhpdCk7XG5cbiAgICByZXR1cm4gdGhpcy5fcm91dGVyLnJvdXRlKHBhdGhEZWYsIF9oZWxwZXJzLmV4dGVuZChfaGVscGVycy5vbWl0KHRoaXMub3B0aW9ucywgWyd0cmlnZ2Vyc0VudGVyJywgJ3RyaWdnZXJzRXhpdCcsICdzdWJzY3JpcHRpb25zJywgJ3ByZWZpeCcsICd3YWl0T24nLCAnbmFtZScsICd0aXRsZScsICd0aXRsZVByZWZpeCcsICdsaW5rJywgJ3NjcmlwdCcsICdtZXRhJ10pLCBvcHRpb25zKSwgZ3JvdXApO1xuICB9XG5cbiAgZ3JvdXAob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgR3JvdXAodGhpcy5fcm91dGVyLCBvcHRpb25zLCB0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBHcm91cDtcbiIsImNsYXNzIFJvdXRlIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwYXRoRGVmLCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICB0aGlzLnBhdGhEZWYgPSBwYXRoRGVmO1xuXG4gICAgLy8gUm91dGUucGF0aCBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gMy4wXG4gICAgdGhpcy5wYXRoID0gcGF0aERlZjtcblxuICAgIHRoaXMuYWN0aW9uID0gb3B0aW9ucy5hY3Rpb24gfHwgRnVuY3Rpb24ucHJvdG90eXBlO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG9wdGlvbnMuc3Vic2NyaXB0aW9ucyB8fCBGdW5jdGlvbi5wcm90b3R5cGU7XG4gICAgdGhpcy5fc3Vic01hcCA9IHt9O1xuICB9XG5cblxuICByZWdpc3RlcihuYW1lLCBzdWIpIHtcbiAgICB0aGlzLl9zdWJzTWFwW25hbWVdID0gc3ViO1xuICB9XG5cblxuICBzdWJzY3JpcHRpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9zdWJzTWFwW25hbWVdO1xuICB9XG5cblxuICBtaWRkbGV3YXJlKCkge1xuICAgIC8vID9cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSb3V0ZTtcbiIsImltcG9ydCBwYWdlICAgICAgICAgZnJvbSAncGFnZSc7XG5pbXBvcnQgUm91dGUgICAgICAgIGZyb20gJy4vcm91dGUuanMnO1xuaW1wb3J0IEdyb3VwICAgICAgICBmcm9tICcuL2dyb3VwLmpzJztcbmltcG9ydCB7IE1ldGVvciB9ICAgZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBfaGVscGVycyB9IGZyb20gJy4uL2xpYi9faGVscGVycy5qcyc7XG5cbmNvbnN0IHFzID0gcmVxdWlyZSgncXMnKTtcblxuY2xhc3MgUm91dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wYXRoUmVnRXhwID0gLyg6W1xcd1xcKFxcKVxcXFxcXCtcXCpcXC5cXD9cXFtcXF1cXC1dKykrL2c7XG4gICAgdGhpcy5fcm91dGVzID0gW107XG4gICAgdGhpcy5fcm91dGVzTWFwID0ge307XG4gICAgdGhpcy5fY3VycmVudCA9IHt9O1xuICAgIHRoaXMuX3NwZWNpYWxDaGFycyA9IFsnLycsICclJywgJysnXTtcbiAgICB0aGlzLl9lbmNvZGVQYXJhbSA9IHBhcmFtID0+IHtcbiAgICAgIGNvbnN0IHBhcmFtQXJyID0gcGFyYW0uc3BsaXQoJycpO1xuICAgICAgbGV0IF9wYXJhbSA9ICcnO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbUFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5fc3BlY2lhbENoYXJzLmluY2x1ZGVzKHBhcmFtQXJyW2ldKSkge1xuICAgICAgICAgIF9wYXJhbSArPSBlbmNvZGVVUklDb21wb25lbnQoZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtQXJyW2ldKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIF9wYXJhbSArPSBlbmNvZGVVUklDb21wb25lbnQocGFyYW1BcnJbaV0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIF9wYXJhbSArPSBwYXJhbUFycltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBfcGFyYW07XG4gICAgfTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgICAvLyBob2xkcyBvblJvdXRlIGNhbGxiYWNrc1xuICAgIHRoaXMuX29uUm91dGVDYWxsYmFja3MgPSBbXTtcblxuICAgIHRoaXMudHJpZ2dlcnMgPSB7XG4gICAgICBlbnRlcigpIHtcbiAgICAgICAgLy8gY2xpZW50IG9ubHlcbiAgICAgIH0sXG4gICAgICBleGl0KCkge1xuICAgICAgICAvLyBjbGllbnQgb25seVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBtYXRjaFBhdGgocGF0aCkge1xuICAgIGNvbnN0IHBhcmFtcyA9IHt9O1xuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVzLmZpbmQociA9PiB7XG4gICAgICBjb25zdCBwYWdlUm91dGUgPSBuZXcgcGFnZS5Sb3V0ZShyLnBhdGhEZWYpO1xuICAgICAgcmV0dXJuIHBhZ2VSb3V0ZS5tYXRjaChwYXRoLCBwYXJhbXMpO1xuICAgIH0pO1xuICAgIGlmICghcm91dGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBwYXJhbXM6IF9oZWxwZXJzLmNsb25lKHBhcmFtcyksXG4gICAgICByb3V0ZTogX2hlbHBlcnMuY2xvbmUocm91dGUpLFxuICAgIH07XG4gIH1cblxuICBzZXRDdXJyZW50KGN1cnJlbnQpIHtcbiAgICB0aGlzLl9jdXJyZW50ID0gY3VycmVudDtcbiAgfVxuXG4gIHJvdXRlKHBhdGhEZWYsIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghL15cXC8uKi8udGVzdChwYXRoRGVmKSAmJiBwYXRoRGVmICE9PSAnKicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncm91dGVcXCdzIHBhdGggbXVzdCBzdGFydCB3aXRoIFwiL1wiJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgcm91dGUgPSBuZXcgUm91dGUodGhpcywgcGF0aERlZiwgb3B0aW9ucyk7XG4gICAgdGhpcy5fcm91dGVzLnB1c2gocm91dGUpO1xuXG4gICAgaWYgKG9wdGlvbnMubmFtZSkge1xuICAgICAgdGhpcy5fcm91dGVzTWFwW29wdGlvbnMubmFtZV0gPSByb3V0ZTtcbiAgICB9XG5cbiAgICB0aGlzLl90cmlnZ2VyUm91dGVSZWdpc3Rlcihyb3V0ZSk7XG4gICAgcmV0dXJuIHJvdXRlO1xuICB9XG5cbiAgZ3JvdXAob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgR3JvdXAodGhpcywgb3B0aW9ucyk7XG4gIH1cblxuICBwYXRoKF9wYXRoRGVmLCBmaWVsZHMgPSB7fSwgcXVlcnlQYXJhbXMpIHtcbiAgICBsZXQgcGF0aERlZiA9IF9wYXRoRGVmO1xuICAgIGlmICh0aGlzLl9yb3V0ZXNNYXBbcGF0aERlZl0pIHtcbiAgICAgIHBhdGhEZWYgPSB0aGlzLl9yb3V0ZXNNYXBbcGF0aERlZl0ucGF0aDtcbiAgICB9XG5cbiAgICBsZXQgcGF0aCA9IHBhdGhEZWYucmVwbGFjZSh0aGlzLnBhdGhSZWdFeHAsIChfa2V5KSA9PiB7XG4gICAgICBjb25zdCBmaXJzdFJlZ2V4cENoYXIgPSBfa2V5LmluZGV4T2YoJygnKTtcbiAgICAgIC8vIGdldCB0aGUgY29udGVudCBiZWhpbmQgOiBhbmQgKFxcXFxkKy8pXG4gICAgICBsZXQga2V5ID0gX2tleS5zdWJzdHJpbmcoMSwgZmlyc3RSZWdleHBDaGFyID4gMCA/IGZpcnN0UmVnZXhwQ2hhciA6IHVuZGVmaW5lZCk7XG4gICAgICAvLyByZW1vdmUgKz8qXG4gICAgICBrZXkgPSBrZXkucmVwbGFjZSgvW1xcK1xcKlxcP10rL2csICcnKTtcblxuICAgICAgaWYgKGZpZWxkc1trZXldKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmNvZGVQYXJhbShgJHtmaWVsZHNba2V5XX1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICcnO1xuICAgIH0pO1xuXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwvXFwvKy9nLCAnLycpOyAvLyBSZXBsYWNlIG11bHRpcGxlIHNsYXNoZXMgd2l0aCBzaW5nbGUgc2xhc2hcblxuICAgIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaFxuICAgIC8vIGJ1dCBrZWVwIHRoZSByb290IHNsYXNoIGlmIGl0J3MgdGhlIG9ubHkgb25lXG4gICAgcGF0aCA9IHBhdGgubWF0Y2goL15cXC97MX0kLykgPyBwYXRoIDogcGF0aC5yZXBsYWNlKC9cXC8kLywgJycpO1xuXG4gICAgY29uc3Qgc3RyUXVlcnlQYXJhbXMgPSBxcy5zdHJpbmdpZnkocXVlcnlQYXJhbXMgfHwge30pO1xuICAgIGlmIChzdHJRdWVyeVBhcmFtcykge1xuICAgICAgcGF0aCArPSBgPyR7c3RyUXVlcnlQYXJhbXN9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIG9uUm91dGVSZWdpc3RlcihjYikge1xuICAgIHRoaXMuX29uUm91dGVDYWxsYmFja3MucHVzaChjYik7XG4gIH1cblxuICBfdHJpZ2dlclJvdXRlUmVnaXN0ZXIoY3VycmVudFJvdXRlKSB7XG4gICAgLy8gV2Ugc2hvdWxkIG9ubHkgbmVlZCB0byBzZW5kIGEgc2FmZSBzZXQgb2YgZmllbGRzIG9uIHRoZSByb3V0ZVxuICAgIC8vIG9iamVjdC5cbiAgICAvLyBUaGlzIGlzIG5vdCB0byBoaWRlIHdoYXQncyBpbnNpZGUgdGhlIHJvdXRlIG9iamVjdCwgYnV0IHRvIHNob3dcbiAgICAvLyB0aGVzZSBhcmUgdGhlIHB1YmxpYyBBUElzXG4gICAgY29uc3Qgcm91dGVQdWJsaWNBcGkgPSBfaGVscGVycy5waWNrKGN1cnJlbnRSb3V0ZSwgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ3BhdGhEZWYnLFxuICAgICAgJ3BhdGgnLFxuICAgIF0pO1xuICAgIHJvdXRlUHVibGljQXBpLm9wdGlvbnMgPSBfaGVscGVycy5vbWl0KGN1cnJlbnRSb3V0ZS5vcHRpb25zLCBbXG4gICAgICAndHJpZ2dlcnNFbnRlcicsXG4gICAgICAndHJpZ2dlcnNFeGl0JyxcbiAgICAgICdhY3Rpb24nLFxuICAgICAgJ3N1YnNjcmlwdGlvbnMnLFxuICAgICAgJ25hbWUnLFxuICAgIF0pO1xuXG4gICAgdGhpcy5fb25Sb3V0ZUNhbGxiYWNrcy5mb3JFYWNoKGNiID0+IHtcbiAgICAgIGNiKHJvdXRlUHVibGljQXBpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdvKCkge1xuICAgIC8vIGNsaWVudCBvbmx5XG4gIH1cblxuICBjdXJyZW50KCkge1xuICAgIC8vIGNsaWVudCBvbmx5XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnQ7XG4gIH1cblxuICBtaWRkbGV3YXJlKCkge1xuICAgIC8vIGNsaWVudCBvbmx5XG4gIH1cblxuICBnZXRTdGF0ZSgpIHtcbiAgICAvLyBjbGllbnQgb25seVxuICB9XG5cbiAgZ2V0QWxsU3RhdGVzKCkge1xuICAgIC8vIGNsaWVudCBvbmx5XG4gIH1cblxuICBnZXRSb3V0ZU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnQucm91dGUgPyB0aGlzLl9jdXJyZW50LnJvdXRlLm5hbWUgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXRRdWVyeVBhcmFtKGtleSkge1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50LnF1ZXJ5ID8gdGhpcy5fY3VycmVudC5xdWVyeVBhcmFtc1trZXldIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgc2V0U3RhdGUoKSB7XG4gICAgLy8gY2xpZW50IG9ubHlcbiAgfVxuXG4gIHNldFBhcmFtcygpIHt9XG5cbiAgcmVtb3ZlU3RhdGUoKSB7XG4gICAgLy8gY2xpZW50IG9ubHlcbiAgfVxuXG4gIGNsZWFyU3RhdGVzKCkge1xuICAgIC8vIGNsaWVudCBvbmx5XG4gIH1cblxuICByZWFkeSgpIHtcbiAgICAvLyBjbGllbnQgb25seVxuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICAvLyBjbGllbnQgb25seVxuICB9XG5cbiAgd2FpdCgpIHtcbiAgICAvLyBjbGllbnQgb25seVxuICB9XG5cbiAgdXJsKCkge1xuICAgIC8vIFdlIG5lZWQgdG8gcmVtb3ZlIHRoZSBsZWFkaW5nIGJhc2UgcGF0aCwgb3IgXCIvXCIsIGFzIGl0IHdpbGwgYmUgaW5zZXJ0ZWRcbiAgICAvLyBhdXRvbWF0aWNhbGx5IGJ5IGBNZXRlb3IuYWJzb2x1dGVVcmxgIGFzIGRvY3VtZW50ZWQgaW46XG4gICAgLy8gaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jL2Z1bGwvbWV0ZW9yX2Fic29sdXRldXJsXG4gICAgcmV0dXJuIE1ldGVvci5hYnNvbHV0ZVVybCh0aGlzLnBhdGguYXBwbHkodGhpcywgYXJndW1lbnRzKS5yZXBsYWNlKG5ldyBSZWdFeHAoJ14nICsgKCcvJyArICh0aGlzLl9iYXNlUGF0aCB8fCAnJykgKyAnLycpLnJlcGxhY2UoL1xcL1xcLysvZywgJy8nKSksICcnKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUm91dGVyO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gICAgIGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgX2hlbHBlcnMgfSAgIGZyb20gJy4vLi4vLi4vbGliL19oZWxwZXJzLmpzJztcbmltcG9ydCB7IEZsb3dSb3V0ZXIgfSBmcm9tICcuLi9faW5pdC5qcyc7XG5cbmlmKCFQYWNrYWdlWydzdGFyaW5nYXRsaWdodHM6ZmFzdC1yZW5kZXInXSkge1xuICByZXR1cm47XG59XG5cbmNvbnN0IEZhc3RSZW5kZXIgPSBQYWNrYWdlWydzdGFyaW5nYXRsaWdodHM6ZmFzdC1yZW5kZXInXS5GYXN0UmVuZGVyO1xuXG5jb25zdCBzZXR1cEZhc3RSZW5kZXIgPSAoKSA9PiB7XG4gIEZsb3dSb3V0ZXIuX3JvdXRlcy5mb3JFYWNoKChyb3V0ZSkgPT4ge1xuICAgIGlmIChyb3V0ZS5wYXRoRGVmID09PSAnKicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBGYXN0UmVuZGVyLnJvdXRlKHJvdXRlLnBhdGhEZWYsIGZ1bmN0aW9uIChyb3V0ZVBhcmFtcywgcGF0aCkge1xuICAgICAgLy8gYW55b25lIHVzaW5nIE1ldGVvci5zdWJzY3JpYmUgZm9yIHNvbWV0aGluZyBlbHNlP1xuICAgICAgY29uc3QgbWV0ZW9yU3Vic2NyaWJlID0gTWV0ZW9yLnN1YnNjcmliZTtcbiAgICAgIE1ldGVvci5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGFyZ3VtZW50cyk7XG4gICAgICB9O1xuXG4gICAgICByb3V0ZS5fc3Vic01hcCA9IHt9O1xuICAgICAgRmxvd1JvdXRlci5zdWJzY3JpcHRpb25zLmNhbGwocm91dGUsIHBhdGgpO1xuICAgICAgaWYgKHJvdXRlLnN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgcm91dGUuc3Vic2NyaXB0aW9ucyhfaGVscGVycy5vbWl0KHJvdXRlUGFyYW1zLCBbJ3F1ZXJ5J10pLCByb3V0ZVBhcmFtcy5xdWVyeSk7XG4gICAgICB9XG5cbiAgICAgIE9iamVjdC5rZXlzKHJvdXRlLl9zdWJzTWFwKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmUuYXBwbHkodGhpcywgcm91dGUuX3N1YnNNYXBba2V5XSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gcmVzdG9yZSBNZXRlb3Iuc3Vic2NyaWJlLCAuLi4gb24gc2VydmVyIHNpZGVcbiAgICAgIE1ldGVvci5zdWJzY3JpYmUgPSBtZXRlb3JTdWJzY3JpYmU7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLy8gaGFjayB0byBydW4gYWZ0ZXIgZXZlcnl0aGluZyBlbHNlIG9uIHN0YXJ0dXBcbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIHNldHVwRmFzdFJlbmRlcigpO1xuICB9KTtcbn0pO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmNvbnN0IF9oZWxwZXJzID0ge1xuICBpc0VtcHR5KG9iaikgeyAvLyAxXG4gICAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0FycmF5KG9iaikgfHwgdGhpcy5pc1N0cmluZyhvYmopIHx8IHRoaXMuaXNBcmd1bWVudHMob2JqKSkge1xuICAgICAgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xuICB9LFxuICBpc09iamVjdChvYmopIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgfSxcbiAgb21pdChvYmosIGtleXMpIHsgLy8gMTBcbiAgICBpZiAoIXRoaXMuaXNPYmplY3Qob2JqKSkge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygnW29zdHJpbzpmbG93LXJvdXRlci1leHRyYV0gW19oZWxwZXJzLm9taXRdIEZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYW4gT2JqZWN0Jyk7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5pc0FycmF5KGtleXMpKSB7XG4gICAgICBNZXRlb3IuX2RlYnVnKCdbb3N0cmlvOmZsb3ctcm91dGVyLWV4dHJhXSBbX2hlbHBlcnMub21pdF0gU2Vjb25kIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXknKTtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgY29uc3QgY29weSA9IHRoaXMuY2xvbmUob2JqKTtcbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgZGVsZXRlIGNvcHlba2V5XTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb3B5O1xuICB9LFxuICBwaWNrKG9iaiwga2V5cykgeyAvLyAyXG4gICAgaWYgKCF0aGlzLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIE1ldGVvci5fZGVidWcoJ1tvc3RyaW86Zmxvdy1yb3V0ZXItZXh0cmFdIFtfaGVscGVycy5vbWl0XSBGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGFuIE9iamVjdCcpO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaXNBcnJheShrZXlzKSkge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygnW29zdHJpbzpmbG93LXJvdXRlci1leHRyYV0gW19oZWxwZXJzLm9taXRdIFNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5Jyk7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIGNvbnN0IHBpY2tlZCA9IHt9O1xuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBwaWNrZWRba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBpY2tlZDtcbiAgfSxcbiAgaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmopO1xuICB9LFxuICBleHRlbmQoLi4ub2JqcykgeyAvLyA0XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIC4uLm9ianMpO1xuICB9LFxuICBjbG9uZShvYmopIHtcbiAgICBpZiAoIXRoaXMuaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gdGhpcy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IHRoaXMuZXh0ZW5kKG9iaik7XG4gIH1cbn07XG5cblsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdSZWdFeHAnXS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gIF9oZWxwZXJzWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICB9O1xufSk7XG5cbmV4cG9ydCB7IF9oZWxwZXJzIH07XG4iXX0=
