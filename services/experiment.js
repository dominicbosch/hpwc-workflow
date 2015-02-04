'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET experiments list. 
router.get( '/get/:connection/:project', function( req, res ) {
	var command = 'workflow exp -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET experiments descriptor. 
router.get( '/getDescriptor/:connection/:project/:output', function( req, res ) {
	var filename, username = req.session.pub.username,
		confName = req.params.connection,
		projName = req.params.project,
		output = req.params.output,
		oConn = req.session.pub.configurations[ confName ];

	filename = path.join( oConn.workspace, projName, 'experiments', output, '.experiment' );
	ssh.getRemoteJSON( username, filename, function( err, json ) {
		if( !err ) res.send( json );
	});
});

module.exports = router;