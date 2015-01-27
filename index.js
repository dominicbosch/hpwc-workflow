var config, arrViews, isValidRequest,
	express = require( 'express' ),
	session = require( 'express-session' ),
	bodyParser = require( 'body-parser' ),
	path = require( 'path' ),
	swig = require( 'swig' ),
	fs = require( 'fs' ),
	app = express();

process.on( 'uncaughtException', function( e ) {
	console.log( 'This is a general exception catcher for Antonio\'s convenience but should really be omitted!' );
	console.log( 'Error: ', e );
});

// Load the configuration file.
// This will throw an error if the configuration file is invalid.
config = JSON.parse( fs.readFileSync( __dirname + '/config/system.json' ) );
arrViews = fs.readdirSync( __dirname + '/views' );;

isValidRequest = function( req ) {
	var name = req.params[ 0 ];

	if( !req.session.user ) {
		if( name === 'login' || name === 'register' ) {
			return true;
		} else return false;
	}
	for( var i = 0; i < arrViews.length; i++ ) {
		if( arrViews[ i ] === name + '.html' ) return true;
	}	
};

exports.init = function( args ) {
	var servicePath, fileName, renderingObject,
		arrServices = fs.readdirSync( __dirname + '/services' );

	// We disable caching for development environments
	if( !args.productive ) {
		app.set( 'view cache', false );
		swig.setDefaults({ cache: false });
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

	// Load the session handler as defined in the configuration file.
	app.use( '/session', require( './session_handlers/' + config.session.method ) );

	// Redirect the views that will be loaded by the swig templating engine
	app.get( '/views/*', function ( req, res ) {
		var view = 'index';
		
		if( isValidRequest( req ) ) {
			view = req.params[ 0 ];
		}
		renderingObject = {
			user: req.session.user
		};
		res.render( view, renderingObject );
	});

	// Dynamically load all services from the services folder
	console.log( 'LOADING SERVICES: ' );
	for( var i = 0; i < arrServices.length; i++ ) {
		fileName = arrServices[ i ];
		console.log( '  -> ' + fileName );
		servicePath = '/services/' + fileName.substring( 0, fileName.length - 3 );
		app.use( servicePath, require( '.' + servicePath ) );
	}

	// Start the server
	var server = app.listen( parseInt( args.port ) || 3000, function() {
		var addr = server.address(),
			mode = args.productive ? 'ON' : 'OFF',
			str = 'HPWC SSH Interface Server listening at "http://%s:%s" with CACHING %s';
		console.log( str, addr.address, addr.port, mode.toUpperCase() );
	});
};