#!/usr/bin/env node
var async = require('async');
var fs = require('fs');
var express = require('express');
var https = require('https');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

var timeStartup = new Date();
var isProduction = process.env.NODE_ENV === 'production';
var ports = isProduction ? [80, 443] : [3442, 3443];
var tlsFiles = [__dirname + '/tls/key.pem', __dirname + '/tls/cert.pem'];
var oauthFilesGoogle = [__dirname + '/oauth/clientId.txt', __dirname + '/oauth/clientSecret.txt'];
var path = __dirname + '/views/';

var app = express();
var router = express.Router();
var server; // this might not get initialized in dev

function appFileAccessSync(filename) {
	try {
		console.log('deaguero-org checking %s', filename);
		fs.accessSync(filename, fs.F_OK);
	} catch(e) {
		return false;
	}
	return true;
}

console.log('deaguero-org %s isProduction=%d', timeStartup.toUTCString(), isProduction);

var wantSSL = appFileAccessSync(tlsFiles[0]) && appFileAccessSync(tlsFiles[1]);
console.log('deaguero-org %s wantSSL=%d', timeStartup.toUTCString(), wantSSL);
if(isProduction && !wantSSL) {
	return;
}

var wantGoogleLogin = appFileAccessSync(oauthFilesGoogle[0]) && appFileAccessSync(oauthFilesGoogle[1]);
console.log('deaguero-org %s wantGoogleLogin=%d', timeStartup.toUTCString(), wantGoogleLogin);
if(isProduction && !wantGoogleLogin) {
	return;
}

// configure passport 
passport.use(new GoogleStrategy({
	clientID: fs.readFileSync(oauthFilesGoogle[0], 'ascii').trim(),
	clientSecret: fs.readFileSync(oauthFilesGoogle[1], 'ascii').trim(),
	callbackURL: 'https://www.deaguero.org/auth/google/callback'
},
function(accessToken, refreshToken, profile, cb) {
	// https://developers.google.com/identity/protocols/OpenIDConnect#server-flow
	// todo: create a users database, look up this user, return that instead
	return cb(null, profile.id);
}));

// configure express router
router.use('/', function (req, res, next) {
	var timeRequest = new Date();
	var method = req.method;
	var url = req.url;
	var remoteAddress = req.ip;
	console.log('deaguero-org %s processing %s to %s for %s', timeRequest.toUTCString(), method, url, remoteAddress);
	next();
});

//router.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
router.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
router.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
router.use('/static', express.static(__dirname + '/public')); // redirect static images

router.get('/', function (req, res) {
  res.sendFile(path + "index.html");
});

// add passport routes to the app
app.use(passport.initialize());

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
	session: false
}),
function(req, res) {
	res.redirect('/');
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
	
// add router to the app
app.use("/", router);

// add 404 handling to the app
app.use("*", function(req,res){
  res.sendFile(path + "404.html");
});

// start ssl listener
if(wantSSL) {
  server = https.createServer(
    {
      key: fs.readFileSync(tlsFiles[0]),
      cert: fs.readFileSync(tlsFiles[1])
    },
    app
  );

  server.listen(ports[1], function () {
    console.log('deaguero-org listening for HTTPS on port %d', ports[1]);
  });
}

// start http listener
app.listen(ports[0], function () {
  console.log('deaguero-org listening for HTTP on port %d', ports[0]);
});
