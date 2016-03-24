"use strict";

/** @module route
 */	
var express = require('express'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth20').Strategy;

var route = exports = module.exports = {};

var router = express.Router()

var guest = {
	id : 0,
	displayName : 'Guest'
};

function IsAuth(app, req) {
	if(!app.locals.login.google) {
		return false;
	}
	
	return req.isAuthenticated();
}

route.init = function(app) {
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({ extended: true }));
	
	if(app.locals.session.enabled) {
		app.use(session({
			secret: app.secrets.session.secret,
			resave: false,
			saveUninitialized: false
		}));
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
			return cb(null, user);
		});

		passport.deserializeUser(function(user, cb) {
			return cb(null, user);
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
