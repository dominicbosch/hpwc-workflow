var express = require( 'express' ),
	session = require( 'express-session' ),
	bodyParser = require( 'body-parser' ),
	path = require( 'path' ),
	swig = require( 'swig' ),
	fs = require( 'fs' ),
	app = express();
	
exports.init = function( args ) {
	var servicePath, fileName,
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
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: true
	}));

	app.use( bodyParser.json() );      
	app.use( bodyParser.urlencoded({ extended: true }) );
	app.use( express.static( path.join( __dirname, 'public' ) ) );

	app.get( '/views/*', function ( req, res ) {
		res.render( req.params[ 0 ], req.session.user );
	});

	console.log( 'LOADING SERVICES: ' );
	for( var i = 0; i < arrServices.length; i++ ) {
		fileName = arrServices[ i ];
		console.log( '  -> ' + fileName );
		servicePath = '/services/' + fileName.substring( 0, fileName.length - 3 );
		app.use( servicePath, require( '.' + servicePath ) );
	}

	var server = app.listen( parseInt( args.port ) || 3000, function() {
		var addr = server.address(),
			mode = args.productive ? 'ON' : 'OFF',
			str = 'HPWC SSH Interface Server listening at "http://%s:%s" with CACHING %s';
		console.log( str, addr.address, addr.port, mode.toUpperCase() );
	});
};