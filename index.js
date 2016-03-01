#!/usr/bin/env node
var async = require('async');
var fs = require('fs');
var express = require('express');
var https = require('https');

var timeStartup = new Date();
var isProduction = process.env.NODE_ENV === 'production';
var ports = isProduction ? [80, 443] : [3442, 3443];
var tlsFiles = [__dirname + '/tls/key.pem', __dirname + '/tls/cert.pem'];
var path = __dirname + '/views/';

var app = express();
var router = express.Router();
var server; // this might not get initialized in dev

console.log('deaguero-org %s isProduction=%d', timeStartup.toUTCString(), isProduction);

var wantSSL = true;
try {
	console.log('deaguero-org checking %s', tlsFiles[0]);
	fs.accessSync(tlsFiles[0], fs.F_OK);
} catch(e) {
	wantSSL = false;
}
try {
	console.log('deaguero-org checking %s', tlsFiles[1]);
	fs.accessSync(tlsFiles[1], fs.F_OK);
} catch(e) {
	wantSSL = false;
}

if(isProduction && !wantSSL) {
	return;
}

router.use('/', function (req, res, next) {
	var timeRequest = new Date();
	var method = req.method;
	var url = req.url;
	var remoteAddress = req.ip;
	console.log('deaguero-org %s processing %s to %s for %s', timeRequest.toUTCString(), method, url, remoteAddress);
	next();
});

router.get('/', function (req, res) {
  res.sendFile(path + "index.html");
});

//router.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
router.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
router.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
router.use('/static', express.static(__dirname + '/public')); // redirect static images

app.use("/", router);

app.use("*", function(req,res){
  res.sendFile(path + "404.html");
});

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

app.listen(ports[0], function () {
  console.log('deaguero-org listening for HTTP on port %d', ports[0]);
});
