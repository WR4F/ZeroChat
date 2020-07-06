#!/usr/bin/env node

/**
 * Module dependencies.
 */

let fs = require('fs');
let app = require('../app');
let debug = require('debug')('zc:server');


/**
 * Get port from environment and store in Express and create the HTTP server
 */

let http = require('http');

let httpPort = normalizePort(process.env.HTTP_PORT || 8000);
app.set('httpPort', httpPort);

let httpServer = http.createServer(app);
httpServer.keepAliveTimeout = 0 // Defaults to 5 seconds, override
httpServer.headersTimeout = 0 // Defaults to 60000 ms, override
httpServer.timeout = 0
httpServer.setTimeout(0)

httpServer.listen(httpPort);
httpServer.on('error', onError.bind(null, httpPort));
httpServer.on('listening', onListening.bind(null, httpServer));


/**
 * Get port from environment and store in Express and create the HTTPS server
 */


if (process.env.USE_HTTPS.toLowerCase() === 'true') {

	let https = require('https');

	let privateKey = fs.readFileSync(process.env.ENCRYPTION_HTTPS_PRIV_KEY, 'utf8');
	let certificate = fs.readFileSync(process.env.ENCRYPTION_HTTPS_CERT, 'utf8');
	let credentials = { key: privateKey.replace(/\\n/gm, '\n'), cert: certificate.replace(/\\n/gm, '\n') };

	let httpsPort = normalizePort(process.env.HTTPS_PORT || 8443);
	app.set('httpsPort', httpsPort);

	let httpsServer = https.createServer(credentials, app);
	httpsServer.keepAliveTimeout = 0
	httpsServer.headersTimeout = 0
	httpsServer.timeout = 0
	httpsServer.setTimeout(0)

	httpsServer.listen(httpsPort);
	httpsServer.on('error', onError.bind(null, httpsPort));
	httpsServer.on('listening', onListening.bind(null, httpsServer));
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	let port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(port, error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	let bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server) {
	let addr = server.address();
	let bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	console.info('Listening on ' + bind + ' => http' + (server.cert ? 's' : '') + "://localhost:" + bind.split(' ')[1]);
}
