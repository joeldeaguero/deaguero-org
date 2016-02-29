#!/usr/bin/env node
var express = require('express');
var fs = require('fs');
var https = require('https');

var ports = process.env.NODE_ENV === 'production'
  ? [80, 443]
  : [3442, 3443];

var app = express();

var server = https.createServer(
  {
    key: fs.readFileSync('./tls/key.pem'),
    cert: fs.readFileSync('./tls/cert.pem')
  },
  app
);

server.listen(ports[1], function () {
  console.log('deaguero-org listening for HTTPS on port %d', ports[1]);
});

app.listen(ports[0], function () {
  console.log('deaguero-org listening for HTTP on port %d', ports[0]);
});

app.use('/', function (req, res) {
  res.send('Under construction!!');
});

