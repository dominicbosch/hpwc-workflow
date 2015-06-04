#!/usr/bin/env node
workflow = require( './index' );

// If you want ssh-keygen stdoutput:
// process.env.VERBOSE = true;

workflow({
	port: 8080
	// , production: true
	// ,
	// keyfile: 'config/https-key.pem',
	// certfile: 'config/https-cert.pem'
});