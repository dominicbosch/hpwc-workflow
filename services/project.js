'use strict';

var express = require( 'express' ),
	ssh = require( '../modules/ssh' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	router = express.Router();

// GET projects list. 
router.get( '/getAll/:connection', function( req, res ) {
	var command = 'workflow project -l';
//	if (ssh.isConnOpen ( req.session.pub.username, req.params.connection )) {
		ssh.getAndSendRemoteList( req, res, req.params.connection, command );
//	} else {
//		res.send("");
//	}
});

// TODO Should this be moved into the session service?
// GET descriptor. 
router.get( '/get/:connection/:project', function( req, res ) {

	var filename, pub = req.session.pub,
		oConn = {};

	if ( pub ) {
		oConn = req.session.pub.configurations[ req.params.connection ];
		filename = path.join( oConn.workspace, req.params.project, '.project' );

		ssh.getRemoteJSON( req, res, req.params.connection, filename, function( err, json ) {
			if( !err ) {
				res.send( json );
				//store data in session
				// FIXME Really store in session?
				req.session.pub.selectedConnection.project = json;
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
		oBody = req.body;

	if( oBody.action === 'delete' ) {
		arrCommand = [
			'workflow', 'project', '-d',
			'-p', '"' + oBody.name + '"'
		];
	} else {
		if ( oBody.action === 'create' ) {
			opt = '-c';
		} else if ( oBody.action === 'edit' ) {
			opt = '-e';
		}
		arrCommand = [
			'workflow', 'project', opt,
			'-p', '"' + oBody.name + '"',
			'--params', oBody.par_name,
			'--values', oBody.par_val,
			'--threads', oBody.nthreads,
			'--comment', '"' + oBody.comment + '"'
		];
	}

	ssh.execWorkComm( req, res, conn, arrCommand.join(), function( err, data ) {
		if( !err ) {
			console.log( 'Project manage command (' + arrCommand.join() + ') got data: ' + data );
			res.send( data );
		}
	});
});

module.exports = router;