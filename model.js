'use strict';

/** @module model
 */	

var mongoose = require('mongoose');

var model = exports = module.exports = {};
 
var guest = {
	_id : 0,
	id : 0,
	displayName : 'Guest',
	email : 'guest@deaguero.org'
};

var User = null;

model.init = function(app) {
	if(app.locals.mongodb.enabled) {
		var options = {
			user: app.secrets.mongodb.username,
			pass: app.secrets.mongodb.password
		};
		mongoose.connect('mongodb://localhost/deaguero-org', options);
		User = mongoose.model('User', {
			id : Number,
			displayName : String,
			email : String
		});
	}
	
	model.guest = guest;
	model.User = User;
};
