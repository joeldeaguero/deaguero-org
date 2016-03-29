'use strict';

/** @module app
 */	
var fs = require('fs'),
	express = require('express');

var app = exports = module.exports = express();

function IsString(obj) {
	return typeof obj == 'string';
}

var _isProduction = process.env.NODE_ENV === 'production';
var _platform = process.platform;
var _isWindows = _platform == 'win32';
var _expressCache = false; // in prod, set exactly one
var _swigCache = true;     // of the caches to true

/** config not available to templates
 */	
app.secrets = {
	view : {
		folder: 			__dirname + '/views/',
		expressCache:		_expressCache,
		swigCache:			(!_expressCache && _swigCache)
	},
	ssl: {
		keyFile:			__dirname + '/tls/key.pem',
		key:				null,
		certFile:			__dirname + '/tls/fullchain.pem',
		cert:				null
	},
	login: {
		googleIdFile:		__dirname + '/oauth/clientId.txt',
		googleId:			null,
		googleSecretFile:	__dirname + '/oauth/clientSecret.txt',
		googleSecret:		null
	},
	session: {
		secretFile:			__dirname + '/session/secret.txt',
		secret:				null
	},
	mongodb : {
		username:			'deaguero-org',
		passwordFile:		__dirname + '/mongodb/password.txt',
		password:			null
	}
};

/** config available to templates
 */	
app.locals = {
	title: 'Deaguero.org',
	isProduction: _isProduction,
	platform: _platform,
	isWindows: _isWindows,
	http: {
		enabled: true,
		port: (_isProduction || _isWindows) ? 80 : 3442
	},
	ssl: {
		enabled: false,
		port: (_isProduction || _isWindows) ? 443 : 3443
	},
	login: {
		google: false
	},
	session: {
		enabled: false
	},
	mongodb : {
		enabled: false
	}
};

/** try to read a file, catch errors.  let higher-level code determine fatal/nonfatal
 */	
function appRead(filename, callback) {
	try {
		var data = fs.readFileSync(filename, 'ascii').trim();
		callback(data);
	} catch(err) {
		console.log('deaguero.org: %s', err);
	}
}

app.init = function() {
	appRead(app.secrets.ssl.keyFile,			function(res) { app.secrets.ssl.key = res;				});
	appRead(app.secrets.ssl.certFile,			function(res) { app.secrets.ssl.cert = res;				});
	appRead(app.secrets.login.googleIdFile,		function(res) { app.secrets.login.googleId = res;		});
	appRead(app.secrets.login.googleSecretFile,	function(res) { app.secrets.login.googleSecret = res;	})
	appRead(app.secrets.session.secretFile,		function(res) { app.secrets.session.secret = res;		});
	appRead(app.secrets.mongodb.passwordFile,	function(res) { app.secrets.mongodb.password = res;		});
	
	app.locals.ssl.enabled = IsString(app.secrets.ssl.key) && 
		IsString(app.secrets.ssl.cert);
		
	app.locals.login.google = IsString(app.secrets.login.googleId) && 
		IsString(app.secrets.login.googleSecret);
		
	app.locals.session.enabled = IsString(app.secrets.session.secret);
	
	app.locals.mongodb.enabled = IsString(app.secrets.mongodb.password);
}
