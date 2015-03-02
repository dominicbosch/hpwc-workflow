'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET projects list. 
router.get( '/getAll/:connection', function( req, res ) {
	var command = 'workflow project -l';
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
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
		console.log( 'Method manage command (' + arrCommand.join() + ') got data: ');
		if( !err ) {
			if ( data ) {
				console.log( data );
				res.send( data );
			} else {
				console.log( 'End Of Stream' );
				res.send('Fuck');
			}
		}
	});
});

module.exports = router;