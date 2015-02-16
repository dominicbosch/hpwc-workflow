'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET experiments list. 
router.get( '/getAll/:connection/:project', function( req, res ) {
	var command = 'workflow exp -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET experiments descriptor. 
router.get( '/get/:connection/:project/:experiment', function( req, res ) {
	var filename, oConn = {},
		confName = req.params.connection,
		projName = req.params.project,
		expName = req.params.experiment;

	if ( req.session.pub ) {
		oConn = req.session.pub.configurations[ confName ],
		filename = path.join( oConn.workspace, projName, 'experiments', expName, '.experiment' );
		
		ssh.getRemoteJSON( req, res, confName, filename, function( err, experiment ) {
			if( !err ) {
				res.send( experiment );
			}
		});
	} else {
		res.send( {} );
	}
});

module.exports = router;