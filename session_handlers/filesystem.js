var router = require( 'express' ).Router(),
	fs = require( 'fs' ),
	path = require( 'path' ),
	pathToFile = path.resolve( __dirname, '..', 'config', 'users.json' ),
	oUsers = JSON.parse( fs.readFileSync( pathToFile ) );

console.log(oUsers);

router.post( '/login', function( req, res ) {
	res.send( 'login user' );
});

router.post( '/logout', function( req, res ) {
	res.send( 'logout user' );
});

router.post( '/register', function( req, res ) {
	res.send( 'register user' );
	oUsers[ 'username' ] = 'test';
	fs.writeFileSync( pathToFile, JSON.stringify( oUsers, null, 2 ) );
});

module.exports = router;