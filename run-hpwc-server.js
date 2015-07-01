#!/usr/bin/env node
var workflow = require( './index' )
	, fs = require( 'fs' )

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

// Let's fetch the configuration first before we do anything else
// This will throw an error if the configuration file is invalid.
var config = JSON.parse( fs.readFileSync( __dirname + '/config/system.json' ) );

workflow( config );

/*workflow({
	port: 8080
	// , production: true
	// , keyfile: 'config/https-key.pem'
	// , certfile: 'config/https-cert.pem'
});*/