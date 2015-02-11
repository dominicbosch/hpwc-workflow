'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET methods list. 
router.get( '/getAll/:connection/:project', function( req, res ) {
	var command = 'workflow project_module -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET installed module. 
router.get( '/getInstalled/:connection', function( req, res ) {
	var command = 'workflow project_module -s inst';
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET descriptor. 
router.get( '/get/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, '.module' );

	ssh.getRemoteJSON( req, res, connection, filename, function( err, method ) {
		if( !err ) {
			var command = 'workflow list_src ' 
				+ ' -p ' + req.params.project 
				+ ' -n ' + req.params.method ;
			ssh.getRemoteList( req, res, connection, command, function( err, data ) {
				method.srcList = data;
				res.send( method );
			});
		}
	});
});

// GET source file list
router.get( '/getSrcList/:connection/:project/:method', function( req, res ) {	
	var command = 'workflow list_src ' 
		+ ' -p ' + req.params.project 
		+ ' -n ' + req.params.method ;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET single source file
router.get( '/getSrcFile/:connection/:project/:method/:source_name', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		source_name = req.params.source_name,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, 'src', source_name );

	ssh.getRemoteFile( req, res, connection, filename, function( err, file ) {
		if( !err ) res.send( file );
	});
});

// Manage method. 
router.post( '/manage/:connection/:project', function( req, res ) {
	var opt = '', arrCommand,
		conn = req.params.connection,
		project = req.params.project,
		method = req.body;

	if( method.action === 'delete' ) {
		arrCommand = [
			'workflow', 'project_module', '-d',
			'-p', '"' + project + '"',
			'-n', '"' + method.name + '"'
		];
	} else {
		if( method.action === 'create' ) {
			opt = '-c';
		} else if ( method.action === 'edit' ) {
			opt = '-e';
		}
		arrCommand = [
			'workflow', 'project_module', opt,
			'-p', '"' + project + '"',
			'-m', '"' + method.type + '"',
			'-n', '"' + method.name + '"',
			'--comment', '"' + method.comment + '"'
		];
	}

	ssh.execWorkComm( req, res, conn, arrCommand.join( ' ' ), function( err, data ) {
		if( !err ) {
			console.log( 'Method manage command (' + arrCommand.join() + ') got data: ' + data );
			res.send( data );
		}
	});
});

module.exports = router;