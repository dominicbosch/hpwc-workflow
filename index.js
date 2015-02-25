'use strict';

var config, arrViews, isValidRequest, ssh,
	https = require( 'https' ),
	express = require( 'express' ),
	session = require( 'express-session' ),
	bodyParser = require( 'body-parser' ),
	path = require( 'path' ),
	swig = require( 'swig' ),
	fs = require( 'fs' ),
	socketio = require( './modules/socket' ),
	app = express();

// Load the configuration file.
// This will throw an error if the configuration file is invalid.
config = JSON.parse( fs.readFileSync( __dirname + '/config/system.json' ) );
arrViews = fs.readdirSync( __dirname + '/views' );
global.persistence = require( './persistence_handlers/' + config.persistence.method );
ssh = require( './modules/ssh' ); // We need to load this after setting the persistence handler

isValidRequest = function( req ) {
	var name = req.params[ 0 ];
	for( var i = 0; i < arrViews.length; i++ ) {
		if( arrViews[ i ] === name + '.html' ) return true;
	}	
};

exports.init = function( args ) {
	var server, options, servicePath, fileName, renderingObject,
		arrServices = fs.readdirSync( __dirname + '/services' ).filter(function( d ) {
			return ( d.substring( d.length - 3 ) === '.js' );
		});

	// We disable caching for development environments
	if( args.development ) {
		app.set( 'view cache', false );
		swig.setDefaults({ cache: false });
	} else {
		process.on( 'uncaughtException', function( e ) {
			console.log( 'This is a general exception catcher, but should really be removed in the future!' );
			console.log( 'Error: ', e );
		});
	}

	app.engine( 'html', swig.renderFile );
	app.set( 'view engine', 'html' );
	app.set( 'views', __dirname + '/views' );

	app.use(session({
		secret: config.session.secret,
		resave: false,
		saveUninitialized: true
	}));

	app.use( bodyParser.json() );      
	app.use( bodyParser.urlencoded({ extended: true }) );
	app.use( express.static( path.join( __dirname, 'public' ) ) );

	app.use( function( req, res, next ) {
		var allowedRoutes = [
			'/views/login',
			'/views/register',
			'/services/session/login',
			'/services/users/create'
		];
		if( req.session.pub ) next();
		else {
			if( allowedRoutes.indexOf( req.url ) > -1 ) next();
			else if( req.method === 'GET' ) {
				res.render( 'index' );
			} else {
				res.status( 401 );
				res.send( 'Login first!' );
			}
		}
	});

	// Redirect the views that will be loaded by the swig templating engine
	app.get( '/views/*', function ( req, res ) {
		var view = 'index';		
		if( isValidRequest( req ) ) view = req.params[ 0 ];
		res.render( view, req.session.pub );
	});
	
	// Dynamically load all services from the services folder
	console.log( 'LOADING WEB SERVICES: ' );
	for( var i = 0; i < arrServices.length; i++ ) {
		fileName = arrServices[ i ];
		console.log( '  -> ' + fileName );
		servicePath = '/services/' + fileName.substring( 0, fileName.length - 3 );
		app.use( servicePath, require( '.' + servicePath ) );
	}

	// Redirect if no routing applied so far
	if( !args.development ) app.use( function ( req, res ) { res.render( 'index' ) });

	// Start the server
	// If no key and certificate are provided we start a normal server
	if( !args.keyfile || !args.certfile ) {
		server = app.listen( parseInt( args.port ) || 8080, function() {
			var addr = server.address(),
				mode = args.development ? 'OFF' : 'ON',
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
				mode = args.development ? 'OFF' : 'ON',
				str = 'HPWC SSH Interface Server listening at "https://%s:%s" with CACHING %s';
			console.log( str, addr.address, addr.port, mode.toUpperCase() );
		});
	}
	// Let socket.io listen for websockets
	socketio.listen( server );
};