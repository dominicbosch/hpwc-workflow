hpwc-workflow
=============

A Node JS server architecture to connect to high performance computers via SSH and manage experiments.

Used Libraries:
---------------

- Server: [express](http://expressjs.com)
- Templating engine: [swig](http://paularmstrong.github.io/swig)
- Generate SSH key pairs: [ssh-keygen](https://github.com/ericvicenti/ssh-keygen)
- Connect via SSH: [ssh2](https://github.com/mscdex/ssh2)


Starting the Server:
--------------------

    var server = require( 'hpwc-workflow' );

    // HTTP Server
	server.init({
		port: 8080,
		development: true
	});

    // HTTPS Server
	server.init({
		port: 443,
		development: true,
		keyfile: 'config/https-key.pem',
		certfile: 'config/https-cert.pem'
	});


API:
----

###init( options )

Where `options` can contain following optional arguments:

- port: The port on which to run the server
- development: whether caching on the server side should be turned on or off. Default is development= false which turns on caching
- keyfile: The path to the key file in order to run a HTTPS server
- certfile: The path to the certificate file in order to run a HTTPS server

