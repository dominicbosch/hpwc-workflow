'use strict';

var express = require( 'express' )
	, keygen = require( 'ssh-keygen' )
	, logger = require( '../modules/logger' )(module.filename)
	, router = express.Router()
	, persistence = global.persistence
	;

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
			if( err )
				logger.write( 'error', username, 'SSH-KEYGEN FAILED! ' + err );
			else {
				logger.write( 'debug', username, 'SSH-KEYGEN successful!' );
				persistence.storeUser( username, req.body.password, out.key, out.pubKey );
				res.send( 'New User "' + username + '" registered!' );
			}
		});

	}
});

router.post( '/edit', function( req, res ) {
	var oUser = persistence.getUser( req.session.pub.username );
	if( !oUser ) {
		res.status( 400 );
		res.send( 'You are not existing!??' );
	} else {
		if( req.body.oldpassword !== oUser.password ) {
			res.status( 403 );
			res.send( 'Password incorrect!' );
		} else {
			req.session.password = req.body.newpassword;
			persistence.changeUserPassword( oUser.pub.username, req.body.newpassword );
			res.send( 'Password changed!' );
		}
	}
});

module.exports = router;