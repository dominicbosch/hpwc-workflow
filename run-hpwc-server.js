#!/usr/bin/env node
workflow = require( './index' );

process.on( 'SIGINT', function() {
	console.log( 'Uh-Oh | GOT SIGINT' );
	process.exit();
});

process.on( 'SIGTERM', function() {
	console.log( 'Uh-Oh | GOT SIGTERM' );
	process.exit();
});

// If you want ssh-keygen stdoutput:
// process.env.VERBOSE = true;

workflow({
	port: 8080
	// , production: true
	// , keyfile: 'config/https-key.pem'
	// , certfile: 'config/https-cert.pem'
});