'use strict';

/** @module route
 */	
var express = require('express'),
	favicon = require('serve-favicon'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	bodyParser = require('body-parser'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	model = require('./model');

var route = exports = module.exports = {};

var router = express.Router();

function IsAuth(app, req) {
	if(!app.locals.login.google) {
		return false;
	}
	
	return req.isAuthenticated();
}

function UpdateDatabaseUserFromGoogleProfile(dbuser, googleProfile) {
	dbuser.displayName = googleProfile.displayName;
	dbuser.email = googleProfile.emails[0].value;
	return dbuser;
}

route.init = function(app) {
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({ extended: true }));
	
	if(app.locals.session.enabled) {
		app.use(cookieSession({
			name: 'session',
			secret: app.secrets.session.secret,
			keys: ['key1', 'key2']
		}))
	}
	
	/*router.use('/', function (req, res, next) {
		var auth = IsAuth(app, req);
		var currentUser = auth ? req.user : model.guest;
		console.log('deaguero-org: %s %s %s %d %d %s', 
			req.ip, req.method, req.protocol, auth, currentUser.id, req.url);
		next();
	});*/
	
	if(app.locals.login.google) {
		// configure passport 
		passport.use(new GoogleStrategy({
			clientID: app.secrets.login.googleId,
			clientSecret: app.secrets.login.googleSecret,
			callbackURL: (app.locals.ssl.enabled ? "https://" : "http://") + "www.deaguero.org/auth/google/callback"
		},
		function(accessToken, refreshToken, googleProfile, cb) {
			model.User.findOne({ 'id' : googleProfile.id }, function(err, dbuser) {
				if(err) {
					console.log("deaguero.org: %s", err);
					return cb(err, model.guest);
				}
				var createMode = "updated";
				if(!dbuser) {
					createMode = "created";
					dbuser = new model.User({ id : googleProfile.id });
				}
				UpdateDatabaseUserFromGoogleProfile(dbuser, googleProfile).save(function(err) {
					if(err) {
						console.log("deaguero.org: %s", err);
						return cb(err, model.guest);
					} else {
						console.log("deaguero.org: %s user %s (%d)", createMode, dbuser.email, dbuser.id);
						return cb(null, dbuser);
					}
				});
			});
		}));

		passport.serializeUser(function(user, cb) {
			console.log("s: %s", JSON.stringify(user));
			return cb(null, user._id);
		});

		passport.deserializeUser(function(dbuser_id, cb) {
			console.log("d: %s", JSON.stringify(dbuser_id));
			model.User.findById(dbuser_id, function(err, user) {
				if(err) {
					console.log("deaguero.org: %s", err);
					return cb(err, model.guest);
				}
				return cb(null, user);
			});
		});	
		
		// add passport routes to the app
		app.use(passport.initialize());
		app.use(passport.session());
		
		router.get('/auth/google', passport.authenticate('google', {
			scope: [ // https://developers.google.com/+/web/api/rest/oauth#authorization-scopes
				'profile',
				'email'
			]
		}),
		function(req,res) {
			res.redirect('/'); // should not be called; the user should be redirected to google
		});

		router.get('/auth/google/callback', passport.authenticate('google', {
			successRedirect: '/',
			failureRedirect: '/',
			session: true
		}),
		function(req, res) {
			res.redirect('https://www.deaguero.org/#');
		});

		router.get('/logout', function(req, res) {
			req.logout();
			res.redirect('/');
		});
	}
	
	router.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
	router.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
	router.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
	router.use('/static', express.static(__dirname + '/public'));
	
	var _favicon = favicon(__dirname + '/public/favicon.ico');
	app.use(favicon(__dirname + '/public/favicon.ico'));
	
	router.get('/', function (req, res) {
		var currentUser = IsAuth(app, req) ? req.user : model.guest;
		res.render(app.secrets.view.folder + 'index.ect', { user: currentUser });
	});

	// add router to the app
	app.use("/", router);

	// add 404 handling to the app
	app.use("*", function(req,res){
		res.sendFile(app.secrets.view.folder + "404.html");
	});
};
