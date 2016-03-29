"use strict";

/** @module view
 */	
var ect = require('ect');

var view = exports = module.exports = {};

view.init = function(app) {
	var ectRenderer = ect({ watch: true, root: app.secrets.view.folder, ext : '.ect' });
	app.engine('ect', ectRenderer.render);
	app.set('view engine', 'ect');
	app.set('views', app.secrets.view.folder);
	app.set('view cache', false); // use ect cache instead
};
