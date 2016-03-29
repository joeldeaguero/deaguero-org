"use strict";

/** @module route
 */	
var express = require('express'),
	session = require('express-session'),
	favicon = require('serve-favicon'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	mongoose = require('mongoose');

var route = exports = module.exports = {};

var router = express.Router()

var guest = {
	_id : 0
	id : 0,
	displayName : 'Guest',
	email : 'guest@deaguero.org'
};

var User = null;

function IsAuth(app, req) {
	if(!app.locals.login.google) {
		return false;
	}
	
	return req.isAuthenticated();
}

function UpdateDatabaseUserFromGoogleUser(dbuser, user) {
	dbuser.displayName = user.displayName;
	dbuser.email = user.emails[0].value;
}

route.init = function(app) {
	var _favicon = favicon(__dirname + '/public/favicon.ico');
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({ extended: true }));
	
	if(app.locals.session.enabled) {
		app.use(session({
			secret: app.secrets.session.secret,
			resave: false,
			saveUninitialized: false
		}));
	}
	
	if(app.locals.mongodb.enabled) {
		var options = {
			user: 'deaguero-org',
			pass: app.secrets.mongodb.password
		};
		mongoose.connect('mongodb://localhost/deaguero-org', options);
		User = mongoose.model('User', {
			id : Number,
			displayName : String,
			email : String
		});
	}
	
	router.use('/', function (req, res, next) {
		var auth = IsAuth(app, req);
		var currentUser = auth ? req.user : guest;
		console.log('deaguero-org: %s %s %s %d %d %s', 
			req.ip, req.method, req.protocol, auth, currentUser.id, req.url);
		next();
	});
	
	if(app.locals.login.google) {
		// configure passport 
		passport.use(new GoogleStrategy({
			clientID: app.secrets.login.googleId,
			clientSecret: app.secrets.login.googleSecret,
			callbackURL: (app.locals.ssl.enabled ? "https://" : "http://") + "www.deaguero.org/auth/google/callback"
		},
		function(accessToken, refreshToken, profile, cb) {
			// https://developers.google.com/identity/protocols/OpenIDConnect#server-flow
			// todo: create a users database, look up this user, return that instead
			return cb(null, profile);
		}));

		passport.serializeUser(function(user, cb) {
			User.findOne({ 'id' : user.id }, function(err, dbuser) {
				if(err) {
					console.log("deaguero.org: %s", err);
					return cb(err, guest._id);
				}
				var createMode = "updated";
				if(!dbuser) {
					createMode = "created";
					dbuser = new User({ id : user.id });
				}
				UpdateDatabaseUserFromGoogleUser(dbuser, user);
				dbuser.save(function(err) {
					if(err) {
						console.log("deaguero.org: %s", err);
						return cb(err, guest._id);
					} else {
						console.log("deaguero.org: %s user %s (%d)", createMode, dbuser.email, dbuser.id);
						return cb(null, dbuser._id);
					}
				});
			});
		});

		passport.deserializeUser(function(dbuser_id, cb) {
			User.findById(dbuser_id, function(err, user) {
				if(err) {
					console.log("deaguero.org: %s", err);
					return cb(err, guest);
				}
				return cb(null, user);
			});
		});	
		
		// add passport routes to the app
		app.use(passport.initialize());
		app.use(passport.session());
		
		app.get('/auth/google', passport.authenticate('google', {
			scope: [ // https://developers.google.com/+/web/api/rest/oauth#authorization-scopes
				'profile',
				'email'
			]
		}),
		function(req,res) {
			res.redirect('/'); // should not be called; the user should be redirected to google
		});

		app.get('/auth/google/callback', passport.authenticate('google', {
			successRedirect: '/',
			failureRedirect: '/',
			session: true
		}),
		function(req, res) {
			res.redirect('/');
		});

		app.get('/logout', function(req, res) {
			req.logout();
			res.redirect('/');
		});
	}
	
	router.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
	router.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
	router.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
	router.use('/static', express.static(__dirname + '/public'));
	router.use(favicon(__dirname + '/public/favicon.ico'));
	
	app.get('/', function (req, res) {
		var currentUser = IsAuth(app, req) ? req.user : guest;
		res.render(app.secrets.view.folder + 'index.html', { user: currentUser });
	});

	// add router to the app
	app.use("/", router);

	// add 404 handling to the app
	app.use("*", function(req,res){
		res.sendFile(app.secrets.view.folder + "404.html");
	});
};
