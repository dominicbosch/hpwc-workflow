'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// buildAndGet graph
router.post( '/buildAndGet/:connection/:project/:experiment', function( req, res ) {
	var arrCommand, oConn = {},
		confName = req.params.connection,
		projName = req.params.project,
		expName = req.params.experiment,
		experiment = req.body;

	if ( req.session.pub ) {
		oConn = req.session.pub.configurations[ confName ];

		arrCommand = [
			'workflow', 'build_graph',
			'-p', '"' + projName + '"',
			'-e', expName,
			'-d', experiment.dimensions,
			'-m', experiment.methods,
			'-t', experiment.nthreads,
			'-f', experiment.fixed
		];
		
		ssh.execWorkComm( req, res, confName, arrCommand.join( ' ' ), function( err, data ) {
			var pos, command, remotePath = '';

			if( !err ) {
				console.log( 'Project manage command (' + arrCommand.join(' ') + ') got data: ' + data );
				
				pos = data.indexOf( ':' );
				if( pos !== -1 ) {
					remotePath = data.substring( pos + 1 ).trim();
				}
				
				if ( remotePath !== '' ){

					command = 'base64 ' + remotePath;

					ssh.executeCommand( req, res, confName, command, false, function( err, encImage ) {
						console.log( 'Encode Image: ' + encImage);
						res.send( encImage);
					});
				} else {
					res.send( '' );
				}
			}
		});

	} else {
		res.send( '' );
	}
});

module.exports = router;