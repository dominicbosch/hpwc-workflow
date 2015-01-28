var express = require( 'express' ),
	router = express.Router(),
	persistence = global.persistence;

router.post( '/login', function( req, res ) {
	var oUser = persistence.getUser( req.body.username );

	if( oUser && oUser.password === req.body.password ) {
		req.session.public = {
			user : oUser.user
		};
		res.send( 'Login successful!' );
	} else {
		res.status( 401 );
		res.send( 'Login failed!' );
	}
});

router.post( '/logout', function( req, res ) {
	delete req.session.public;
	res.send( 'Goodbye!' );
});

module.exports = router;