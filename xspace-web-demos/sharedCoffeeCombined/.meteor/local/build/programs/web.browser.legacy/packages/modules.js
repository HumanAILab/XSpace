//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;

/* Package-scope variables */
var meteorBabelHelpers;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"client.js":function module(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/client.js                                                           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
require("./install-packages.js");
require("./stubs.js");
require("./process.js");
require("./reify.js");

exports.addStyles = require("./css").addStyles;

//////////////////////////////////////////////////////////////////////////////////////////

},"legacy.js":function module(require){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/legacy.js                                                           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
// The meteor-babel/plugins/sanitize-for-in-objects plugin generates code
// that uses meteorBabelHelpers.sanitizeForInObject, but only when
// compiling code for the web.browser.legacy bundle. See #10595.
meteorBabelHelpers = require("meteor-babel-helpers");

//////////////////////////////////////////////////////////////////////////////////////////

},"css.js":function module(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/css.js                                                              //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
var doc = document;
var head = doc.getElementsByTagName("head").item(0);

exports.addStyles = function (css) {
  var style = doc.createElement("style");

  style.setAttribute("type", "text/css");

  // https://msdn.microsoft.com/en-us/library/ms535871(v=vs.85).aspx
  var internetExplorerSheetObject =
    style.sheet || // Edge/IE11.
    style.styleSheet; // Older IEs.

  if (internetExplorerSheetObject) {
    internetExplorerSheetObject.cssText = css;
  } else {
    style.appendChild(doc.createTextNode(css));
  }

  return head.appendChild(style);
};

//////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/install-packages.js                                                 //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("mobile-experience");
install("modules-runtime");
install("modules", "meteor/modules/client.js");
install("modern-browsers");
install("babel-compiler");
install("ecmascript");
install("ecmascript-runtime");
install("babel-runtime", "meteor/babel-runtime/babel-runtime.js");
install("promise", "meteor/promise/client.js");
install("fetch", "meteor/fetch/legacy.js");
install("dynamic-import", "meteor/dynamic-import/client.js");
install("es5-shim", "meteor/es5-shim/client.js");
install("ecmascript-runtime-client", "meteor/ecmascript-runtime-client/legacy.js");
install("base64", "meteor/base64/base64.js");
install("ejson", "meteor/ejson/ejson.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("random", "meteor/random/main_client.js");
install("mongo-id", "meteor/mongo-id/id.js");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("tracker");
install("minimongo", "meteor/minimongo/minimongo_client.js");
install("check", "meteor/check/match.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload", "meteor/reload/reload.js");
install("socket-stream-client", "meteor/socket-stream-client/browser.js");
install("ddp-client", "meteor/ddp-client/client/client.js");
install("ddp");
install("ddp-server");
install("allow-deny");
install("mongo-dev-server");
install("insecure");
install("mongo");
install("blaze-html-templates");
install("jquery", "meteor/jquery/main.js");
install("reactive-var");
install("minifier-css");
install("standard-minifier-css");
install("standard-minifier-js");
install("typescript");
install("shell-server");
install("autopublish");
install("reactive-dict", "meteor/reactive-dict/migration.js");
install("underscore");
install("observe-sequence");
install("deps");
install("htmljs");
install("blaze");
install("spacebars");
install("templating-compiler");
install("templating-runtime");
install("templating");
install("ostrio:flow-router-extra", "meteor/ostrio:flow-router-extra/client/_init.js");
install("webapp", "meteor/webapp/webapp_client.js");
install("livedata");
install("hot-code-push");
install("launch-screen");
install("ui");
install("autoupdate", "meteor/autoupdate/autoupdate_client.js");

//////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/process.js                                                          //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/reify.js                                                            //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
require("reify/lib/runtime").enable(
  module.constructor.prototype
);

//////////////////////////////////////////////////////////////////////////////////////////

},"stubs.js":function module(require){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/modules/stubs.js                                                            //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
var haveStubs = false;
try {
  require.resolve("meteor-node-stubs");
  haveStubs = true;
} catch (noStubs) {}

if (haveStubs) {
  // When meteor-node-stubs is installed in the application's root
  // node_modules directory, requiring it here installs aliases for stubs
  // for all Node built-in modules, such as fs, util, and http.
  require("meteor-node-stubs");
}

//////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"reify":{"lib":{"runtime":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// node_modules/meteor/modules/node_modules/reify/lib/runtime/index.js                  //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");
var Entry = require("./entry.js");

// The exports.enable method can be used to enable the Reify runtime for
// specific module objects, or for Module.prototype (where implemented),
// to make the runtime available throughout the entire module system.
exports.enable = function (mod) {
  if (mod.link !== moduleLink) {
    mod.link = moduleLink;
    mod["export"] = moduleExport;
    mod.exportDefault = moduleExportDefault;
    mod.exportAs = moduleExportAs;
    mod.runSetters = runSetters;

    // Legacy shorthand for mod.exportAs("*").
    mod.makeNsSetter = moduleMakeNsSetter;

    return true;
  }

  return false;
};

// Calling module.link(id, setters) resolves the given ID using
// module.resolve(id), which should return a canonical absolute module
// identifier string (like require.resolve); then creates an Entry object
// for the child module and evaluates its code (if this is the first time
// it has been imported) by calling module.require(id). Finally, the
// provided setter functions will be called with values exported by the
// module, possibly multiple times when/if those exported values change.
// The module.link name is intended to evoke the "liveness" of the
// exported bindings, since we are subscribing to all future exports of
// the child module, not just taking a snapshot of its current exports.
function moduleLink(id, setters, key) {
  utils.setESModule(this.exports);
  Entry.getOrCreate(this.id, this);

  var absChildId = this.resolve(id);
  var childEntry = Entry.getOrCreate(absChildId);

  if (utils.isObject(setters)) {
    childEntry.addSetters(this, setters, key);
  }

  var exports = this.require(absChildId);

  if (childEntry.module === null) {
    childEntry.module = {
      id: absChildId,
      exports: exports
    };
  }

  childEntry.runSetters();
}

// Register getter functions for local variables in the scope of an export
// statement. Pass true as the second argument to indicate that the getter
// functions always return the same values.
function moduleExport(getters, constant) {
  utils.setESModule(this.exports);
  var entry = Entry.getOrCreate(this.id, this);
  entry.addGetters(getters, constant);
  if (this.loaded) {
    // If the module has already been evaluated, then we need to trigger
    // another round of entry.runSetters calls, which begins by calling
    // entry.runModuleGetters(module).
    entry.runSetters();
  }
}

// Register a getter function that always returns the given value.
function moduleExportDefault(value) {
  return this["export"]({
    "default": function () {
      return value;
    }
  }, true);
}

// Returns a function suitable for passing as a setter callback to
// module.link. If name is an identifier, calling the function will set
// the export of that name to the given value. If the name is "*", all
// properties of the value object will be exported by name, except for
// "default" (use "*+" instead of "*" to include it). Why the "default"
// property is skipped: https://github.com/tc39/ecma262/issues/948
function moduleExportAs(name) {
  var entry = this;
  var includeDefault = name === "*+";
  return function (value) {
    if (name === "*" || name === "*+") {
      Object.keys(value).forEach(function (key) {
        if (includeDefault || key !== "default") {
          utils.copyKey(key, entry.exports, value);
        }
      });
    } else {
      entry.exports[name] = value;
    }
  };
}

// Platform-specific code should find a way to call this method whenever
// the module system is about to return module.exports from require. This
// might happen more than once per module, in case of dependency cycles,
// so we want Module.prototype.runSetters to run each time.
function runSetters(valueToPassThrough) {
  Entry.getOrCreate(this.id, this).runSetters();

  // Assignments to exported local variables get wrapped with calls to
  // module.runSetters, so module.runSetters returns the
  // valueToPassThrough parameter to allow the value of the original
  // expression to pass through. For example,
  //
  //   export var a = 1;
  //   console.log(a += 3);
  //
  // becomes
  //
  //   module.export("a", () => a);
  //   var a = 1;
  //   console.log(module.runSetters(a += 3));
  //
  // This ensures module.runSetters runs immediately after the assignment,
  // and does not interfere with the larger computation.
  return valueToPassThrough;
}

// Legacy helper that returns a function that takes a namespace object and
// copies the properties of the namespace to module.exports, excluding any
// "default" property (unless includeDefault is true), which is useful for
// implementing `export * from "module"`.
//
// Instead of using this helper like so:
//
//   module.link(id, { "*": module.makeNsSetter() });
//
// non-legacy code should simply use a string-valued setter:
//
//   module.link(id, { "*": "*" });
//
// or, to include the "default" property:
//
//   module.link(id, { "*": "*+" });
//
// This helper may be removed in a future version of Reify.
function moduleMakeNsSetter(includeDefault) {
  return this.exportAs(includeDefault ? "*+" : "*");
}

//////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// node_modules/meteor/modules/node_modules/reify/lib/runtime/utils.js                  //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var useSetPrototypeOf = typeof Object.setPrototypeOf === "function";
var useSymbol = typeof Symbol === "function";

var esStrKey = "__esModule";
var esSymKey = useSymbol ? Symbol.for(esStrKey) : null;
var useToStringTag = useSymbol && typeof Symbol.toStringTag === "symbol";
var useGetOwnPropDesc =
  typeof Object.getOwnPropertyDescriptor === "function";
var hasOwn = Object.prototype.hasOwnProperty;

function copyKey(key, target, source) {
  if (useGetOwnPropDesc) {
    var desc = Object.getOwnPropertyDescriptor(source, key);
    desc.configurable = true; // Allow redefinition.
    Object.defineProperty(target, key, desc);
  } else {
    target[key] = source[key];
  }
}

exports.copyKey = copyKey;

// Returns obj[key] unless that property is defined by a getter function,
// in which case the getter function is returned.
exports.valueOrGetter = function (obj, key) {
  if (useGetOwnPropDesc && hasOwn.call(obj, key)) {
    var desc = Object.getOwnPropertyDescriptor(obj, key);
    if (typeof desc.get === "function") {
      return desc.get;
    }
  }

  return obj[key];
};

function getESModule(exported) {
  if (isObjectLike(exported)) {
    if (useSymbol && hasOwn.call(exported, esSymKey)) {
      return !! exported[esSymKey];
    }

    if (hasOwn.call(exported, esStrKey)) {
      return !! exported[esStrKey];
    }
  }

  return false;
}

exports.getESModule = getESModule;

function setESModule(exported) {
  if (isObjectLike(exported)) {
    if (useSymbol) {
      exported[esSymKey] = true;
    }

    if (! exported[esStrKey]) {
      // Other module runtime systems may set exported.__esModule such
      // that it can't be redefined, so we call Object.defineProperty only
      // when exported.__esModule is not already true.
      Object.defineProperty(exported, esStrKey, {
        configurable: true,
        enumerable: false,
        value: true,
        writable: false
      });
    }
  }
}

exports.setESModule = setESModule;

function isObject(value) {
  return typeof value === "object" && value !== null;
}

exports.isObject = isObject;

function isObjectLike(value) {
  var type = typeof value;
  return type === "function" || (type === "object" && value !== null);
}

exports.isObjectLike = isObjectLike;

function createNamespace() {
  var namespace = Object.create(null);

  if (useToStringTag) {
    Object.defineProperty(namespace, Symbol.toStringTag, {
      value: "Module",
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  setESModule(namespace);

  return namespace;
}

exports.createNamespace = createNamespace;

function setPrototypeOf(object, proto) {
  if (useSetPrototypeOf) {
    Object.setPrototypeOf(object, proto);
  } else {
    object.__proto__ = proto;
  }
  return object;
}

exports.setPrototypeOf = setPrototypeOf;

//////////////////////////////////////////////////////////////////////////////////////////

},"entry.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// node_modules/meteor/modules/node_modules/reify/lib/runtime/entry.js                  //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");

var GETTER_ERROR = {};
var NAN = {};
var UNDEFINED = {};
var hasOwn = Object.prototype.hasOwnProperty;
var keySalt = 0;

function Entry(id) {
  // The canonical absolute module ID of the module this Entry manages.
  this.id = id;
  // The Module object this Entry manages, unknown until module.export or
  // module.link is called for the first time.
  this.module = null;
  // Getters for local variables exported from the managed module.
  this.getters = Object.create(null);
  // Setters for assigning to local variables in parent modules.
  this.setters = Object.create(null);
  // The normalized namespace object that importers receive when they use
  // `import * as namespace from "..."` syntax.
  this.namespace = utils.createNamespace();
}

var Ep = utils.setPrototypeOf(Entry.prototype, null);
var entryMap = Object.create(null);

Entry.getOrCreate = function (id, mod) {
  var entry = hasOwn.call(entryMap, id)
    ? entryMap[id]
    : entryMap[id] = new Entry(id);

  if (utils.isObject(mod) &&
      mod.id === entry.id) {
    entry.module = mod;
  }

  return entry;
};

function safeKeys(obj) {
  var keys = Object.keys(obj);
  var esModuleIndex = keys.indexOf("__esModule");
  if (esModuleIndex >= 0) {
    keys.splice(esModuleIndex, 1);
  }
  return keys;
}

Ep.addGetters = function (getters, constant) {
  var names = safeKeys(getters);
  var nameCount = names.length;
  constant = !! constant;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var getter = getters[name];

    if (typeof getter === "function" &&
        // Should this throw if this.getters[name] exists?
        ! (name in this.getters)) {
      this.getters[name] = getter;
      getter.constant = constant;
      getter.runCount = 0;
    }
  }
};

Ep.addSetters = function (parent, setters, key) {
  var names = safeKeys(setters);
  var nameCount = names.length;

  if (! nameCount) {
    return;
  }

  // If no key is provided, make a unique key. Otherwise, make sure the key is
  // distinct from keys provided by other parent modules.
  key = key === void 0
    ? makeUniqueKey()
    : parent.id + ":" + key;

  var entry = this;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var setter = normalizeSetterValue(parent, setters[name]);

    if (typeof setter === "function") {
      setter.parent = parent;
      if (! (name in entry.setters)) {
        entry.setters[name] = Object.create(null);
      }
      entry.setters[name][key] = setter;
    }
  }

  entry.runSetters(names);
};

function normalizeSetterValue(module, setter) {
  if (typeof setter === "function") {
    return setter;
  }

  if (typeof setter === "string") {
    // If the value of the setter property is a string, the setter will
    // re-export the imported value using that string as the name of the
    // exported value. If the string is "*", all properties of the value
    // object will be re-exported as individual exports, except for the
    // "default" property (use "*+" instead of "*" to include it).
    return module.exportAs(setter);
  }

  if (Array.isArray(setter)) {
    switch (setter.length) {
    case 0: return null;
    case 1: return normalizeSetterValue(module, setter[0]);
    default:
      var setterFns = setter.map(function (elem) {
        return normalizeSetterValue(module, elem);
      });

      // Return a combined function that calls all of the nested setter
      // functions with the same value.
      return function (value) {
        setterFns.forEach(function (fn) {
          fn(value);
        });
      };
    }
  }

  return null;
}

Ep.runGetters = function (names) {
  // Before running getters, copy anything added to the exports object
  // over to the namespace. Values returned by getters take precedence
  // over these values, but we don't want to miss anything.
  syncExportsToNamespace(this, names);

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(this.getters);
  }

  var nameCount = names.length;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var value = runGetter(this, name);

    // If the getter is run without error, update both entry.namespace and
    // module.exports with the current value so that CommonJS require
    // calls remain consistent with module.watch.
    if (value !== GETTER_ERROR) {
      this.namespace[name] = value;
      this.module.exports[name] = value;
    }
  }
};

function syncExportsToNamespace(entry, names) {
  var setDefault = false;

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (! utils.getESModule(exports)) {
    // If the module entry is managing overrides module.exports, that
    // value should be exposed as the .default property of the namespace,
    // unless module.exports is marked as an ECMASCript module.
    entry.namespace.default = exports;
    setDefault = true;
  }

  if (! utils.isObjectLike(exports)) {
    return;
  }

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(exports);
  }

  names.forEach(function (key) {
    // Don't set any properties for which a getter function exists in
    // entry.getters, don't accidentally override entry.namespace.default,
    // and only copy own properties from entry.module.exports.
    if (! hasOwn.call(entry.getters, key) &&
        ! (setDefault && key === "default") &&
        hasOwn.call(exports, key)) {
      utils.copyKey(key, entry.namespace, exports);
    }
  });
}

// Called whenever module.exports might have changed, to trigger any
// setters associated with the newly exported values. The names parameter
// is optional; without it, all getters and setters will run.
Ep.runSetters = function (names) {
  // Make sure entry.namespace and module.exports are up to date before we
  // call getExportByName(entry, name).
  this.runGetters(names);

  // Lazily-initialized object mapping parent module identifiers to parent
  // module objects whose setters we might need to run.
  var parents;

  forEachSetter(this, names, function (setter, name, value) {
    if (parents === void 0) {
      parents = Object.create(null);
    }
    parents[setter.parent.id] = setter.parent;

    // The param order for setters is `value` then `name` because the `name`
    // param is only used by namespace exports.
    setter(value, name);
  });

  if (! parents) {
    return;
  }

  // If any of the setters updated the module.exports of a parent module,
  // or updated local variables that are exported by that parent module,
  // then we must re-run any setters registered by that parent module.
  var parentIDs = Object.keys(parents);
  var parentIDCount = parentIDs.length;

  for (var i = 0; i < parentIDCount; ++i) {
    // What happens if parents[parentIDs[id]] === module, or if
    // longer cycles exist in the parent chain? Thanks to our setter.last
    // bookkeeping above, the runSetters broadcast will only proceed
    // as far as there are any actual changes to report.
    var parent = parents[parentIDs[i]];
    var parentEntry = entryMap[parent.id];
    if (parentEntry) {
      parentEntry.runSetters();
    }
  }
};

function callSetterIfNecessary(setter, name, value, callback) {
  if (name === "__esModule") {
    // Ignore setters asking for module.exports.__esModule.
    return;
  }

  var shouldCall = false;

  if (setter.last === void 0) {
    setter.last = Object.create(null);
    // Always call the setter if it has never been called before.
    shouldCall = true;
  }

  function changed(name, value) {
    var valueToCompare = value;
    if (valueToCompare !== valueToCompare) {
      valueToCompare = NAN;
    } else if (valueToCompare === void 0) {
      valueToCompare = UNDEFINED;
    }

    if (setter.last[name] === valueToCompare) {
      return false;
    }

    setter.last[name] = valueToCompare;
    return true;
  }

  if (name === "*") {
    var keys = safeKeys(value);
    var keyCount = keys.length;
    for (var i = 0; i < keyCount; ++i) {
      var key = keys[i];
      // Evaluating value[key] is risky because the property might be
      // defined by a getter function that logs a deprecation warning (or
      // worse) when evaluated. For example, Node uses this trick to
      // display a deprecation warning whenever crypto.createCredentials
      // is accessed. Fortunately, when value[key] is defined by a getter
      // function, it's enough to check whether the getter function itself
      // has changed, since we are careful elsewhere to preserve getters
      // rather than prematurely evaluating them.
      if (changed(key, utils.valueOrGetter(value, key))) {
        shouldCall = true;
      }
    }
  } else if (changed(name, value)) {
    shouldCall = true;
  }

  if (shouldCall) {
    // Only invoke the callback if we have not called this setter
    // (with a value of this name) before, or the current value is
    // different from the last value we passed to this setter.
    return callback(setter, name, value);
  }
}

// Invoke the given callback once for every (setter, name, value) that needs to
// be called. Note that forEachSetter does not call any setters itself, only the
// given callback.
function forEachSetter(entry, names, callback) {
  var needToCheckNames = true;

  if (names === void 0) {
    names = Object.keys(entry.setters);
    needToCheckNames = false;
  }

  var nameCount = names.length;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];

    if (needToCheckNames &&
        ! hasOwn.call(entry.setters, name)) {
      continue;
    }

    var setters = entry.setters[name];
    var keys = Object.keys(setters);
    var keyCount = keys.length;

    for (var j = 0; j < keyCount; ++j) {
      var key = keys[j];
      var value = getExportByName(entry, name);

      callSetterIfNecessary(setters[key], name, value, callback);

      var getter = entry.getters[name];
      if (typeof getter === "function" &&
          // Sometimes a getter function will throw because it's called
          // before the variable it's supposed to return has been
          // initialized, so we need to know that the getter function has
          // run to completion at least once.
          getter.runCount > 0 &&
          getter.constant) {
        // If we happen to know that this getter function has run
        // successfully, and will never return a different value, then we
        // can forget the corresponding setter, because we've already
        // reported that constant value. Note that we can't forget the
        // getter, because we need to remember the original value in case
        // anyone tampers with entry.module.exports[name].
        delete setters[key];
      }
    }
  }
}

function getExportByName(entry, name) {
  if (name === "*") {
    return entry.namespace;
  }

  if (hasOwn.call(entry.namespace, name)) {
    return entry.namespace[name];
  }

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (name === "default" &&
      ! (utils.getESModule(exports) &&
         "default" in exports)) {
    return exports;
  }

  if (exports == null) {
    return;
  }

  return exports[name];
}

function makeUniqueKey() {
  return Math.random()
    .toString(36)
    // Add an incrementing salt to help track key ordering and also
    // absolutely guarantee we never return the same key twice.
    .replace("0.", ++keySalt + "$");
}

function runGetter(entry, name) {
  var getter = entry.getters[name];
  try {
    var result = getter();
    ++getter.runCount;
    return result;
  } catch (e) {}
  return GETTER_ERROR;
}

module.exports = Entry;

//////////////////////////////////////////////////////////////////////////////////////////

}}}},"meteor-babel-helpers":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// node_modules/meteor/modules/node_modules/meteor-babel-helpers/package.json           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
module.exports = {
  "name": "meteor-babel-helpers",
  "version": "0.0.3",
  "main": "index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// node_modules/meteor/modules/node_modules/meteor-babel-helpers/index.js               //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
function canDefineNonEnumerableProperties() {
  var testObj = {};
  var testPropName = "t";

  try {
    Object.defineProperty(testObj, testPropName, {
      enumerable: false,
      value: testObj
    });

    for (var k in testObj) {
      if (k === testPropName) {
        return false;
      }
    }
  } catch (e) {
    return false;
  }

  return testObj[testPropName] === testObj;
}

function sanitizeEasy(value) {
  return value;
}

function sanitizeHard(obj) {
  if (Array.isArray(obj)) {
    var newObj = {};
    var keys = Object.keys(obj);
    var keyCount = keys.length;
    for (var i = 0; i < keyCount; ++i) {
      var key = keys[i];
      newObj[key] = obj[key];
    }
    return newObj;
  }

  return obj;
}

meteorBabelHelpers = module.exports = {
  // Meteor-specific runtime helper for wrapping the object of for-in
  // loops, so that inherited Array methods defined by es5-shim can be
  // ignored in browsers where they cannot be defined as non-enumerable.
  sanitizeForInObject: canDefineNonEnumerableProperties()
    ? sanitizeEasy
    : sanitizeHard,

  // Exposed so that we can test sanitizeForInObject in environments that
  // support defining non-enumerable properties.
  _sanitizeForInObjectHard: sanitizeHard
};

//////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/modules/client.js");
require("/node_modules/meteor/modules/legacy.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall,
  meteorBabelHelpers: meteorBabelHelpers
});

})();
