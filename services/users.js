'use strict';

var express = require( 'express' ),
	keygen = require( 'ssh-keygen' ),
	router = express.Router(),
	persistence = global.persistence;

router.post( '/create', function( req, res ) {
	var username = req.body.username;
	if( persistence.getUser( username ) ) {
		res.status( 409 );
		res.send( 'User already existing!' );
	} else {
		keygen({
			location: __dirname + '/tmp_rsa',
			password: req.body.password,
			read: true,
			force: true,
			destroy: true,
			comment: 'workflow-' + username + '@nodejs-server'
		},function( err, out ) {
			if( err ) console.log( 'SSH-KEYGEN FAILED: ' + err );
			else {
				// console.log( 'SSH-KEYGEN successful!' );
				persistence.storeUser( username, req.body.password, out.key, out.pubKey );
				res.send( 'New User "' + username + '" registered!' );
			}
		});

	}
});

module.exports = router;