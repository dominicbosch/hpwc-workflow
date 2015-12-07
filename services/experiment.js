'use strict';

var express = require( 'express' )
	, ssh = require( '../modules/ssh' )
	, logger = require( '../modules/logger' )(module.filename)
	, path = require( 'path' )
	, fs = require( 'fs' )
	, router = express.Router()
	;

// GET experiments list. 
router.get( '/getAll/:connection/:project', function( req, res ) {
	var command = 'workflow exp -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command, 'experiments' );
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
			if( !err ) res.send( experiment );
			else if( err.code !== 1 ) {
				res.status( 400 );
				res.send( err.message );
			}
		});
	} else {
		res.send( {} );
	}
});

// run experiment
router.post( '/run/:connection/:project', function( req, res ) {
	var arrCommand, oConn = {},
		confName = req.params.connection,
		projName = req.params.project,
		experiment = req.body;

	if ( req.session.pub ) {
		oConn = req.session.pub.configurations[ confName ];

		arrCommand = [
			'workflow', 'run_exp',
			'-p', '"' + projName + '"',
			'-e', experiment.nexecs,
			'-d', experiment.dimensions,
			'-m', experiment.methods,
			'-t', experiment.nthreads
		];
		
		ssh.execWorkCommAndEmit( req, res, confName, projName, arrCommand.join( ' ' ), function( err, data ) {
			if( !err ) res.send( data );
			else if( err.code !== 1 ) {
				res.status( 400 );
				res.send( err.message );
			}
		});

	} else {
		res.send( '' );
	}
});

// run experiment with job
router.post( '/run_job/:connection/:project', function( req, res ) {
	var arrCommand, oConn = {},
		confName = req.params.connection,
		projName = req.params.project,
		experiment = req.body;

	if ( req.session.pub ) {
		oConn = req.session.pub.configurations[ confName ];
		//adapt dimensions list for job command
		experiment.dimensions = experiment.dimensions.replace( /"/g, '\\"');
		arrCommand = [
			'workflow', 'job_run_exp',
			'"' + experiment.sched_type + '"',
			path.join( oConn.workspace
				, projName
				, 'experiments'
				//, new Date().getTime().toString() 
			),
			'"' + experiment.nodes + '"',
			'"' + experiment.sched_part + '"',
			'"' + experiment.walltime + '"',
			'"' + experiment.memory + '"',
			'-p', '"' + projName + '"',
			'-e', experiment.nexecs,
			'-d', experiment.dimensions,
			'-m', experiment.methods,
			'-t', experiment.nthreads
		];
		
		ssh.execWorkCommAndEmit( req, res, confName, projName, arrCommand.join( ' ' ), function( err, data ) {
			if( !err ) res.send( data );
			else if( err.code !== 1 ) {
				res.status( 400 );
				res.send( err.message );
			}
		});

	} else {
		res.send( '' );
	}
});

// Delete Experiment
router.get( '/delete/:connection/:project/:experiment', function( req, res ) {
	var arrCommand,
		confName = req.params.connection,
		projName = req.params.project,
		expName = req.params.experiment;

	//get experiment descriptor
	if ( req.session.pub ) {
		
		arrCommand = [
			'workflow', 'exp', '-d',
			'-p', '"' + projName + '"',
			'-x', expName
		];

		ssh.execWorkCommSync( req, res, confName, arrCommand.join( ' ' ), function( err, data ) {
			logger.write( 'debug', req.session.pub.username,
						'Delete experiment command (' + arrCommand.join( ' ' )
						+ ') got data: \n' + data );
			if( !err ) {
				res.send( { msg: data } );
			} else {
				res.send( { err: true, msg: err } );
			}
		});
	} else {
		res.send( { err: true, msg: 'Error: No connection' } );
	}
});

module.exports = router;