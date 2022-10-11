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
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var $, jQuery;

var require = meteorInstall({"node_modules":{"meteor":{"jquery":{"main.js":function module(require,exports){

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/jquery/main.js                                                           //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
try {
  var jQuery = require("jquery");
} catch (e) {
  console.warn([
    "The jquery npm package could not be found in your node_modules directory.",
    "Please run the following command to install it:",
    "",
    "  meteor npm install jquery",
    "",
    "If you previously relied on a specific version of jquery, it may be important",
    "to install that version; for example:",
    "",
    "  meteor npm install jquery@1.12.1",
    "",
  ].join("\n"));
}

if (jQuery) {
  // Provide values for the exported variables of the jquery package.
  exports.$ = exports.jQuery = jQuery;

  // There's no stopping legacy code from referring to window.$ or
  // window.jQuery, so we have to keep defining those properties globally,
  // but at least the exports of this package will be reliable.
  global.$ = global.$ || jQuery;
  global.jQuery = global.jQuery || jQuery;
}

///////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/jquery/main.js");

/* Exports */
Package._define("jquery", exports, {
  $: $,
  jQuery: jQuery
});

})();
