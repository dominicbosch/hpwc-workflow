'use strict';

module.exports = exports = function( args ) {
	process.env.NODE_ENV = args.production ? 'production' : 'development';

	// Now let's get to twerk:
	var socketio, config, isValidRequest, sessionMiddleware,
		server, options, servicePath, fileName, validLevels, ll,
		runAsHTTPS = args.keyfile && args.certfile,
		arrServices, arrViews,
		oUserSessions = {},
		fs = require( 'fs' ),
		path = require( 'path' ),
		swig = require( 'swig' ),
		https = require( 'https' ),
		express = require( 'express' ),
		session = require( 'express-session' ),
		bodyParser = require( 'body-parser' ),
		log = require( './modules/logger' ),
		app = express();

	// Let's fetch the configuration first before we do anything else
	// This will throw an error if the configuration file is invalid.
	config = JSON.parse( fs.readFileSync( __dirname + '/config/system.json' ) );

	// Set the log level
	validLevels = [
		'fatal',
		'error',
		'warn',
		'info',
		'debug',
		'trace'
	];
	ll = args.loglevel || config.loglevel || 'info';
	if( validLevels.indexOf( ll ) < 0 ) ll = 'info';
	log.level( ll );
	log.info( 'Setting Log level to: ' + ll );

	// Define a global persistence handler according to the configuration
	global.persistence = require( './persistence_handlers/' + config.persistence.method );
	// For consistency reasons we should only load our modules after setting the persistence module
	socketio = require( './modules/socket' );

	// We disable caching for development environments
	if( args.production ) {
		process.on( 'uncaughtException', function( e ) {
			console.log( 'This is a general exception catcher, but should really be removed in the future!' );
			console.log( 'Error: ', e );
		});
	} else {
		app.set( 'view cache', false );
		swig.setDefaults({ cache: false });
	}

	app.engine( 'html', swig.renderFile );
	app.set( 'view engine', 'html' );
	app.set( 'views', __dirname + '/views' );
	if( runAsHTTPS ) app.set( 'trust proxy', 1 ) // required for secure cookies

	sessionMiddleware = session({
		secret: config.session.secret,
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: runAsHTTPS ? true : false // We can only use secure cookies on a HTTPS server
		}
	});
	app.use( sessionMiddleware );

	app.use( bodyParser.json() );      
	app.use( bodyParser.urlencoded({ extended: true }) );
	app.use( express.static( path.join( __dirname, 'public' ) ) );

	// Apply our own session expiration handler
	app.use( function( req, res, next ) {
		var username;
		if( req.session.pub ) {
			username = req.session.pub.username;

			// We need to be sure that we do some garbage collecting after the user session expired
			if( oUserSessions[ username ] ) clearTimeout( oUserSessions[ username ] );
			oUserSessions[ username ] = setTimeout( function() {
				// since the session is still existing (user still on webpage in browser) we destroy it, right?
				if( req.session.pub ) req.session.destroy();
				console.log('TODO: cleaning up session of user "' + username + '"!');
				// TODO CLEANUP
			}, config.session.timeout * 60 * 1000 ); // Session expiration time is defined in minutes in the config
		}
		next(); // Continue with the other handlers
	});

	app.get( '/views/*', function( req, res, next ) {
		var allowedRoutes = [
			'/views/login'
		];
		if( req.session.pub || allowedRoutes.indexOf( req.url ) > -1 ) next();
		else res.render( 'login' );
	});
	app.get( '/services/*', function( req, res, next ) {
		var allowedRoutes = [
			'/services/session/login'
		];
		if( req.session.pub || allowedRoutes.indexOf( req.url ) > -1 ) next();
		else {
			res.status( 401 );
			res.send( 'Login first!' );
		}
	});

	// Load all existing views
	arrViews = fs.readdirSync( __dirname + '/views' );
	isValidRequest = function( req ) {
		var name = req.params[ 0 ];
		for( var i = 0; i < arrViews.length; i++ ) {
			if( arrViews[ i ] === name + '.html' ) return true;
		}	
	};
	// Redirect the views that will be loaded by the swig templating engine
	app.get( '/views/*', function ( req, res ) {
		var view = 'index';		
		if( isValidRequest( req ) ) view = req.params[ 0 ];
		res.render( view, req.session.pub );
	});
	
	// Dynamically load all services from the services folder
	console.log( 'LOADING WEB SERVICES: ' );
	arrServices = fs.readdirSync( __dirname + '/services' ).filter(function( d ) {
		return ( d.substring( d.length - 3 ) === '.js' );
	});
	for( var i = 0; i < arrServices.length; i++ ) {
		fileName = arrServices[ i ];
		console.log( '  -> ' + fileName );
		servicePath = '/services/' + fileName.substring( 0, fileName.length - 3 );
		app.use( servicePath, require( '.' + servicePath ) );
	}

	// Redirect if no routing applied so far
	if( args.production ) app.use( function ( req, res ) { res.render( 'index' ) });

	// Start the server
	// If no key and certificate are provided we start a normal server
	if( !runAsHTTPS ) {
		server = app.listen( parseInt( args.port ) || 8080, function() {
			var addr = server.address(),
				mode = args.production ? 'ON' : 'OFF',
				str = 'HPWC SSH Interface Server listening at "http://%s:%s" with CACHING %s';
			console.log( str, addr.address, addr.port, mode.toUpperCase() );
		});

	// Else we are starting a HTTPS server
	} else {
		options = {
			key: fs.readFileSync( args.keyfile ),
			cert: fs.readFileSync( args.certfile )
		};
		server = https.createServer( options, app ).listen( parseInt( args.port ) || 443, function() {
			var addr = server.address(),
				mode = args.production ? 'ON' : 'OFF',
				str = 'HPWC SSH Interface Server listening at "https://%s:%s" with CACHING %s';
			console.log( str, addr.address, addr.port, mode.toUpperCase() );
		});
	}
	// Let socket.io listen for websockets
	socketio.listen( server, sessionMiddleware );
};