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

    var workflow = require( 'hpwc-workflow' );

    // HTTP Server
	workflow({ port: 8080 });

    // HTTPS Server
	workflow({
		port: 443,
		production: true,
		keyfile: 'config/https-key.pem',
		certfile: 'config/https-cert.pem'
	});


API:
----

###init( options )

Where `options` can contain following optional arguments:

- port: The port on which to run the server
- production: Set this property and the system will be run in production mode. Sets the process.env.NODE_ENV accordingly, plus disables caching on the server side if in production mode. Default is production=false which turns off caching of web pages through the rendering engine
- keyfile: The path to the key file in order to run a HTTPS server
- certfile: The path to the certificate file in order to run a HTTPS server

