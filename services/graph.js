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
		
		ssh.execWorkCommSync( req, res, confName, arrCommand.join( ' ' ), function( err, data ) {
			var pos, command, remotePath = '';

			if( !err ) {
				console.log( 'Project manage command (' + arrCommand.join(' ') + ') got data: \n' + data );
				
				pos = data.indexOf( 'Graph path:' );
				if( pos !== -1 ) {
					remotePath = data.substring( pos + 12 ).trim();
				}
				
				if ( remotePath !== '' ){

					command = 'base64 ' + remotePath;

					ssh.executeCommandSync( req, res, confName, command, function( err, encImage ) {
						if( !err ) res.send( encImage );
						else if( err.code !== 1 ) {
							res.status( 400 );
							res.send( err.message );
						}
					});
				} else {
					res.send( '' );
				}
			} else if( err.code !== 1 ) {
				res.status( 400 );
				res.send( err.message );
			}
		});

	} else {
		res.send( '' );
	}
});

module.exports = router;