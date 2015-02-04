var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET methods list. 
router.get( '/get/:connection/:project', function( req, res ) {
	var command = 'workflow project_module -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET installed module. 
router.get( '/getInstalled/:connection', function( req, res ) {
	var command = 'workflow project_module -s inst';
	ssh.getAndSendRemoteList( req, res, req.params.connection, command );
});

// GET descriptor. 
router.get( '/getDescriptor/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, '.module' );

	ssh.getRemoteJSON( req, res, connection, filename, function( err, json ) {
		if( !err ) res.send( json );
	});
});

// Manage method. 
router.post( '/manage/:connection/:project', function( req, res ) {
	var opt = '', arrCommand,
		oBody = req.body,
		conn = req.params.connection,
		project = req.params.project;

	if( oBody.action === 'delete' ) {
		arrCommand = [
			'workflow', 'project_module', '-d',
			'-p', '"' + project + '"',
			'-n', '"' + oBody.name + '"'
		];
	} else {
		if( oBody.action === 'create' ) {
			opt = '-c';
		} else if ( oBody.action === 'edit' ) {
			opt = '-m';
		}
		// FIXME if oBody.action === 'edit' then there is twice the -m flag in the command??
		arrCommand = [
			'workflow', 'project_module', opt,
			'-p', '"' + project + '"',
			'-m', '"' + oBody.type + '"',
			'-n', '"' + oBody.name + '"',
			'--comment', '"' + oBody.comment + '"'
		];
	}

	ssh.execWorkComm( req, res, conn, arrCommand.join(), function( err, data ) {
		if( !err ) {
			console.log( 'Method manage command (' + arrCommand.join() + ') got data: ' + data );
			res.send( data );
		}
	});
});

module.exports = router;