var router = require( 'express' ).Router(),
	fs = require( 'fs' ),
	path = require( 'path' ),
	pathToFile = path.resolve( __dirname, '..', 'config', 'users.json' ),
	oUsers = JSON.parse( fs.readFileSync( pathToFile ) );

router.post( '/login', function( req, res ) {
	var username = req.body.username;

	if( oUsers[ username ] && oUsers[ username ].password === req.body.password ) {
		req.session.user = oUsers[ username ].user;
		res.send( 'Login successful!' );
	} else {
		res.status( 401 );
		res.send( 'Login failed!' );
	}
});

router.post( '/logout', function( req, res ) {
	delete req.session.user;
	res.send( 'Goodbye!' );
});

router.post( '/register', function( req, res ) {
	var username = req.body.username;
	if( oUsers[ username ] ) {
		res.status( 409 );
		res.send( 'User already existing!' );
	} else {
		oUsers[ username ] = {
			user: {
				name: username,
				console: 'Welcome to the HPWC Workflow Manager!\n\n'
			},
			password: req.body.password
		};
		fs.writeFileSync( pathToFile, JSON.stringify( oUsers, null, 2 ) );
		res.send( 'New User ' + username + ' registered!' );
	}
});

module.exports = router;