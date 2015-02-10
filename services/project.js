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

	var filename, pub = req.session.pub,
		oConn = {};

	if ( pub ) {
		oConn = pub.configurations[ req.params.connection ];
		filename = path.join( oConn.workspace, req.params.project, '.project' );

		ssh.getRemoteJSON( req, res, req.params.connection, filename, function( err, json ) {
			if( !err ) {
				pub.selectedConnection.selectedProject = json.name;	
				res.send( json );
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

	ssh.execWorkComm( req, res, conn, arrCommand.join( ' ' ), function( err, data ) {
		if( !err ) {
			console.log( 'Project manage command (' + arrCommand.join(' ') + ') got data: ' + data );
			res.send( data );
		}
	});
});

module.exports = router;