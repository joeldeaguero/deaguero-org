#!/usr/bin/env node
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Under construction!');
});

app.listen(80, function () {
  console.log('deaguero-org listening on port 80');
});
