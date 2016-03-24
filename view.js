"use strict";

/** @module view
 */	
var swig = require('swig');

var view = exports = module.exports = {};

view.init = function(app) {
	app.engine('html', swig.renderFile);
	app.set('view engine', 'html');
	app.set('views', app.secrets.view.folder);
	app.set('view cache', app.secrets.view.expressCache);
	swig.setDefaults({ cache: (app.secrets.view.swigCache ? 'memory' : false) });
};

