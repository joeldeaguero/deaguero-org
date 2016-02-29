#!/usr/bin/env node
var async = require('async');
var fs = require('fs');
var express = require('express');
var https = require('https');

var timeStartup = new Date();
var isProduction = process.env.NODE_ENV === 'production';
console.log('deaguero-org %s isProduction=%d', timeStartup.toUTCString(), isProduction);

var ports = isProduction ? [80, 443] : [3442, 3443];
var tlsFiles = ['./tls/key.pem', './tls/cert.pem'];
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

var app = express();
var server;

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

app.use('/', function (req, res) {
  res.send('Under construction!!');
});

