#!/usr/bin/env node

'use strict';

/** deaguero-org
 */
var https = require('https'),
	app = require('./app'),
	view = require('./view'),
	route = require('./route'),
	model = require('./model'),
	cluster = require('cluster'),
	server = null;
	
app.init();
view.init(app);
model.init(app);
route.init(app);

if (cluster.isMaster) {
    for (var i = 0; i < app.locals.os.cpu.cores; i++) {
        cluster.fork();
    }
} else {
	if(app.locals.ssl.enabled) {
		server = https.createServer({ key: app.secrets.ssl.key, cert: app.secrets.ssl.cert }, app);
		server.listen(app.locals.ssl.port, function() {
			console.log('deaguero-org: HTTPS listener enabled on port %d', app.locals.ssl.port);
		});
	} else {
		console.log('deaguero-org: HTTPS listener disabled');
	}

	if(app.locals.http.enabled) {
		app.listen(app.locals.http.port, function() {
			console.log('deaguero-org: HTTP listener enabled on port %d', app.locals.http.port);
		});
	} else {
		console.log('deaguero-org: HTTP listener disabled');
	}
}
