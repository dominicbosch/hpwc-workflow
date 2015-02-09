'use strict';

var express = require( 'express' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	ssh = require( '../modules/ssh' ),
	router = express.Router();

/*
 * TODO 
 * allow connect/disconnect connections
 * dropdown allows selection of the connection without connecting -> in the page button to connect/disconnect
 * 
 *
 *
 *
 *
 *
 *
 */


router.post( '/create', function( req, res ) {
	var args, user = req.session.pub,
		oBody = req.body;

	if( !oBody.name || !oBody.url || !oBody.port || !oBody.workspace || !oBody.workhome
			|| !oBody.username || !oBody.password ) {
		res.status( 400 );
		res.send( 'Missing Parameters!' );
	} else {
		ssh.createConfiguration( req.session.pub.username, oBody, function( err, oConf ) {
			if( err ) {
				console.error( err );
				res.status( 400 );
				res.send( 'Connection initialization failed: ' + err.message );
			} else {
				req.session.pub.configurations[ oConf.name ] = oConf;
				res.send( 'Connection initialization successful!' );
			}
		});
	}
});


router.get( '/connect/:name', function( req, res ) {
	var oUser = req.session.pub;
	ssh.connectToHost( oUser.username, oUser.configurations[ req.params.name ], function( err ) {
		if( err ) {
			console.log( err );
			res.status( 400 );
			res.send("Connection failed!");
		} else {
			if (req.session.pub.selectedConnection.name === req.params.name ) {
				req.session.pub.selectedConnection.status = true;
			}
			res.send("Connection Created!");
		}
	});
});

router.get( '/disconnect/:name', function( req, res ) {
	if ( ssh.closeConnection( req.session.pub.username, req.params.name ) ) {
		if (req.session.pub.selectedConnection.name === req.params.name ) {
			req.session.pub.selectedConnection.status = false;
		}
		res.send("Connection Closed!");
	} else {
		res.status( 404 );
		res.send("Connection not found!");
	}
});

router.get( '/getAll', function( req, res ) {
	var pub = (req.session.pub || {} );
	res.send( pub.configurations );
});

router.get( '/get/:name', function( req, res ) {
	var pub = req.session.pub;
	if ( pub ) {
		//requesting a connection set also the connection and the status in session
		pub.selectedConnection = {
			name : req.params.name,
			status : ssh.isConnOpen( pub.username, req.params.name )
		};
		res.send( pub.configurations[ req.params.name ] );
	} else {
		res.send( {} );
	}
	
});


router.get( '/getStatus/:name', function( req, res ) {
	if (ssh.isConnOpen ( req.session.pub.username, req.params.connection )) {
		res.send(true);
		//res.send( "open" );
	} else {
		res.send(false);
		//res.send("closed");
	}
});

module.exports = router;
