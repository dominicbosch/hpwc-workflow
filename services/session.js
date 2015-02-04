'use strict';

var express = require( 'express' ),
	router = express.Router(),
	persistence = global.persistence;

router.post( '/login', function( req, res ) {
	var oUser = persistence.getUser( req.body.username );

	if( oUser && oUser.password === req.body.password ) {
		req.session.pub = oUser.pub;
		res.send( 'Login successful!' );
	} else {
		res.status( 401 );
		res.send( 'Login failed!' );
	}
});

router.post( '/logout', function( req, res ) {
	delete req.session.pub;
	res.send( 'Goodbye!' );
});

router.get( '/cleanProject', function( req, res ) {
	delete req.session.pub.selectedConnection.project;
	res.send( 'Project cleaned from session' );
});

module.exports = router;