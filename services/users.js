'use strict';

var express = require( 'express' ),
	router = express.Router(),
	persistence = global.persistence;

router.post( '/create', function( req, res ) {
	var username = req.body.username;
	if( persistence.getUser( username ) ) {
		res.status( 409 );
		res.send( 'User already existing!' );
	} else {
		persistence.storeUser( username, req.body.password );
		res.send( 'New User "' + username + '" registered!' );
	}
});

module.exports = router;