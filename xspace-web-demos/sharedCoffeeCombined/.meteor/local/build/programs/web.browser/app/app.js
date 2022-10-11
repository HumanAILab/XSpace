var require = meteorInstall({"client":{"main.html":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// client/main.html                                                              //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.link("./template.main.js", { "*": "*+" });

///////////////////////////////////////////////////////////////////////////////////

},"template.main.js":function module(){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// client/template.main.js                                                       //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //

Template.body.addContent((function() {
  var view = this;
  return HTML.Raw('<canvas id="c"></canvas>\n    <div class="viewContainer" id="viewContainerWorldBuilder">\n        <div class="view" id="viewBuilder"></div>\n        <div class="view" id="viewA"></div>\n        <div class="view" id="viewB"></div>\n    </div>\n    <div class="viewContainer" id="viewContainerUser">\n        <div class="view" id="viewFirst"></div>\n    </div>\n    <div id="controls">\n        <input type="button" class="button" id="defineIntersection" value="Define Intersection">\n        <input type="button" class="button" id="clearIntersection" value="Clear Intersection">\n        <input type="button" class="button" id="shareIntersection" value="Share Intersection">\n        <input type="button" class="button" id="clearShared" value="Clear Shared">\n    </div>');
}));
Meteor.startup(Template.body.renderToDocument);

///////////////////////////////////////////////////////////////////////////////////

},"main.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// client/main.js                                                                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.link("./main.html");
let FlowRouter;
module.link("meteor/ostrio:flow-router-extra", {
  FlowRouter(v) {
    FlowRouter = v;
  }

}, 0);
// Identify user
var appType;
var worldId;
FlowRouter.route("/:app/:user", {
  name: "app.select",

  action(params, queryParams) {
    appType = params.app;

    if (params.app == "user") {
      worldId = params.user;
    }
  }

});

window.onload = function () {
  if (appType == "user") {
    document.getElementById("viewContainerWorldBuilder").style.display = "none";
    document.getElementById("controls").style.display = "none";
  } else if (appType == "configure") {
    document.getElementById("viewContainerUser").style.display = "none";
  }
};
///////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".html",
    ".css"
  ]
});

var exports = require("/client/main.js");