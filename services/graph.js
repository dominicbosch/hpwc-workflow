'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// buildAndGet graph
router.post( '/buildAndGet/:connection/:project/:experiment', function( req, res ) {
	var remotePath, localPath, arrCommand, 
		oConn = {}, imgPath,
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
			if( !err ) {
				console.log( 'Project manage command (' + arrCommand.join(' ') + ') got data: ' + data );
				
				remotePath = path.join( 
					oConn.workspace.replace( '~', '.' ), 
					projName, 'experiments', 
					expName, 'graph.png' );

				imgPath = path.join( path.dirname(require.main.filename), 
					'public/img/' );
				
				localPath = path.join( imgPath,
					req.session.pub.username 
					+ '_' + expName 
					+ '_' + 'graph.png' );

				ssh.getFile ( req, res, confName, remotePath, localPath, function( localFile ) {
					console.log( 'localFile: ' + localFile );
					res.send( localFile );
				});
			}
		});

	} else {
		res.send( {} );
	}
});

module.exports = router;