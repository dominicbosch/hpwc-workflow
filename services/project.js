'use strict';

var express = require( 'express' )
	, ssh = require( '../modules/ssh' )
	, logger = require( '../modules/logger' )(module.filename)
	, path = require( 'path' )
	, fs = require( 'fs' )
	, router = express.Router()
	;

// GET projects list. 
router.get( '/getAll/:connection', function( req, res ) {
	var command = 'workflow project -l';
	ssh.getAndSendRemoteList( req, res, req.params.connection, command, 'Projects' );
});

// GET descriptor. 
router.get( '/get/:connection/:project', function( req, res ) {

	var filename, oConn = {},
		confName = req.params.connection,
		projName = req.params.project;

	if ( req.session.pub ) {
		oConn = req.session.pub.configurations[ confName ];
		filename = path.join( oConn.workspace, projName, '.project' );

		ssh.getRemoteJSON( req, res, confName, filename, function( err, project ) {
			if( !err ) {
				req.session.pub.selectedConnection.selectedProject = project.name;	
				res.send( project );
			} else if( err.code !== 1 ) {
				res.status( 400 );
				res.send( err.message );
			}
		});
	} else {
		res.send( {} );
	}
});

// Manage project 
router.post( '/manage/:connection', function( req, res ) {
	var arrCommand, opt = '',
		conn = req.params.connection,
		project = req.body;

	if( project.action === 'delete' ) {
		arrCommand = [
			'workflow', 'project', '-d',
			'-p', '"' + project.name + '"'
		];
	} else {
		if ( project.action === 'create' ) {
			opt = '-c';
		} else if ( project.action === 'edit' ) {
			opt = '-e';
		}
		arrCommand = [
			'workflow', 'project', opt,
			'-p', '"' + project.name + '"',
			'--params', project.par_name,
			'--values', project.par_val,
			'--threads', project.nthreads,
			'--comment', '"' + project.comment + '"'
		];
	}

	ssh.execWorkCommSync( req, res, conn, arrCommand.join( ' ' ), function( err, data ) {
		if( !err ) {
			if ( data ) {
				logger.write( 'debug', req.session.pub.username,
						'Project manage command (' + arrCommand.join()
						+ ') got data: \n' + data );
				res.send( data );
			} else {
				logger.write( 'debug', req.session.pub.username,
						'Project manage command (' + arrCommand.join()
						+ ') got No data');
				res.send( '' );
			}
		} else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

router.get( '/getLog/:connection/:project', function( req, res ) {	
	var username = req.session.pub.username,
		connection = req.params.connection,
		project = req.params.project;

	ssh.getLog( username, connection, project, function( log ) {
		res.send( log );
	});
});

router.get( '/kill/:connection/:project', function( req, res ) {

	ssh.killCommand( req, res, function( err, data ) {

		if( !err ) {
			if ( data ) {
				logger.write( 'debug', req.session.pub.username,
						'Project manage command ( kill_proc_tree ) got data: \n' + data );
				res.send( data );
			} else {
				logger.write( 'debug', req.session.pub.username,
						'Project manage command ( kill_proc_tree ) got No error but... No data! Check this!' );
				res.send( '' );
			}
		} else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

module.exports = router;