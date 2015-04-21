
process.on( 'SIGINT', function() {
	console.log( 'Uh-Oh | GOT SIGINT' );
	process.exit();
});

process.on( 'SIGTERM', function() {
	console.log( 'Uh-Oh | GOT SIGTERM' );
	process.exit();
});

workflow = require( './index' );

// If you want ssh-keygen stdoutput:
// process.env.VERBOSE = true;

workflow({
	port: 8081
	, production: true
	// ,
	// keyfile: 'config/https-key.pem',
	// certfile: 'config/https-cert.pem'
});
