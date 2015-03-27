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