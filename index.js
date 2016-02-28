#!/usr/bin/env node
var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('Under construction');
});

server.listen(80);
