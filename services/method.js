'use strict';

var oUserLogs = {}, 
	commandActive = {
		status : false,
		project : ''
	}
	, express = require( 'express' )
	, ssh = require( '../modules/ssh' )
	, logger = require( '../modules/logger' )(module.filename)
	, path = require( 'path' )
	, fs = require( 'fs' )
	, socketio = require( '../modules/socket' )
	, router = express.Router()
	;

// GET methods list. 
router.get( '/getAll/:connection/:project', function( req, res ) {
	var command = 'workflow method -l -p ' + req.params.project;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command, 'Methods' );
});

// GET installed method's type. 
router.get( '/getInstalled/:connection', function( req, res ) {
	var command = 'workflow methodType -l installed';
	ssh.getAndSendRemoteList( req, res, req.params.connection, command, 'MethodTypes' );
});

// GET descriptor. 
router.get( '/get/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, '.method' );

	ssh.getRemoteJSON( req, res, connection, filename, function( err, method ) {
		if( !err ) {
			var command = 'workflow list_src' 
				+ ' -p ' + req.params.project 
				+ ' -n ' + req.params.method
				+ ' -f src';
			ssh.getRemoteList( req, res, connection, command, 'Sources', function( err, data ) {
				if( !err ) {
					method.srcList = data;
					res.send( method );
				} else if( err.code !== 1 ) {
					res.status( 400 );
					res.send( err );
				}
			});
		} else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err );
		}
	});
});

// GET file from folder. 
router.get( '/get/:connection/:project/:method/:folder', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		folder = req.params.folder,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, '.method' ),
		command = 'workflow list_src'
			+ ' -p ' + req.params.project 
			+ ' -n ' + req.params.method
			+ ' -f ' + folder ;

	ssh.getRemoteList( req, res, connection, command, 'Sources', function( err, data ) {
		var list = '';
		if ( !err ) {
			list = data;
		}
		res.send( list );
	});
});

// action on method: compile, run, ecc.
/*router.get( '/:action/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		action = req.params.action,
		command = 'workflow ' + action + ' -p ' + project + ' -n ' + method;

	var alldata = '';

	ssh.execWorkComm( req, res, connection, command, function( err, data ) {
		console.log( 'Method manage command (' + command + ') got data: ');

		if( !err ) {
			if ( data ) {
				console.log( data.toString() );
				alldata += data;
				//res.write( data );
			} else {
				//res.end();
				console.log( 'End Of Stream' );
				res.send( alldata );
			}
		} else {
			res.send( alldata + '...Error' );
		}
	});
});*/

/*router.get( '/getLog/:connection/:project', function( req, res ) {	
	var username = req.session.pub.username,
		connection = req.params.connection,
		commandActiveTemp = {
			project : commandActive.project,
			status : commandActive.status
		},
		log = '',
		project = req.params.project;

	//if log exists
	if ( oUserLogs[ username ] 
		&& oUserLogs[ username ][ connection ] 
		&& oUserLogs[ username ][ connection ][ project ] ) {

		if ( commandActiveTemp.project !== project ) {
			commandActiveTemp.status = false;
		}
		log = oUserLogs[ username ][ connection ][ project ];
	}
	else {
		commandActiveTemp = { project : '', status : false };
		log = '';
	}
	res.send( { 
		commandActive : commandActiveTemp, 
		log : log
	});
});

router.get( '/:action/:connection/:project/:method', function( req, res ) {	
	var message = '', err = null,
		username = req.session.pub.username,
		connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		action = req.params.action,
		command = 'workflow ' + action + ' -p ' + project + ' -n ' + method;

	if ( commandActive.status ) {

		message = 'Wait until the previous command is finished';

		if ( commandActive.project !== project ) {
			err = 'Project "' + commandActive.project 
						+ '" still busy select it to check the status';
		}

		res.send( { 
			err : err, 
			log : message 
		});
	} else {

		if ( !oUserLogs[ username ] ) {
			oUserLogs[ username ] = {};
		}
		if ( !oUserLogs[ username ][ connection ] ) {
			oUserLogs[ username ][ connection ] = {};
		}

		oUserLogs[ username ][ connection ][ project ] = '';

		ssh.execWorkComm( req, res, connection, command, function( err, data ) {
			console.log( 'Method manage command (' + command + ') got data: ');

			if( !err ) {
				if ( data ) {
					console.log( data.toString() );
					
					//add data to log variable
					oUserLogs[ username ][ connection ][ project ] += data;

					if ( !commandActive.status ) {
						commandActive.status = true;
						commandActive.project = project;
						res.send( { 
							err : null, 
							log : data.toString() 
						});
					}
				} else {
					console.log( 'End Of Stream' );
					commandActive.status = false;
					commandActive.project = '';
				}
			} else {
				if ( !commandActive.status ) {
					res.send( { 
						err : err, 
						log : data.toString() 
					});
				} else {
					commandActive.status = false;
					commandActive.project = '';
					oUserLogs[ username ][ connection ][ project ] += err;
				}
			}
		});
	}
	
});
*/

router.post( '/do/:action/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		action = req.params.action,
		command = 'workflow ' + action + ' -p ' + project + ' -n ' + method;

	ssh.execWorkCommAndEmit( req, res, connection, project, command, function( err, data ) {
		if( !err ) res.send( data );
		else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

router.post( '/do_job/:action/:connection/:project/:method', function( req, res ) {	
	var connection = req.params.connection,
		oConn = req.session.pub.configurations[ connection ],
		project = req.params.project,
		method = req.params.method,
		action = req.params.action,
		sched_type = req.params.sched_type,
		sched_part = req.params.sched_part,
		job = req.body,
		command = 
			'workflow job_' + action
			+ ' "' + job.sched_type + '"'
			+ ' ' + path.join( oConn.workspace, project, method ) //path to method
			+ ' 0' //nodes
			+ ' "' + job.sched_part + '"'
			+ ' "' + job.walltime + '"'
			+ ' "' + job.memory + '"'
			+ ' -p ' + project 
			+ ' -n ' + method;

	ssh.execWorkCommAndEmit( req, res, connection, project, command, function( err, data ) {
		if( !err ) res.send( data );
		else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

// GET source file list
router.get( '/getSrcList/:connection/:project/:method', function( req, res ) {	
	var command = 'workflow list_src ' 
		+ ' -p ' + req.params.project 
		+ ' -n ' + req.params.method ;
	ssh.getAndSendRemoteList( req, res, req.params.connection, command, 'Sources' );
});

// GET single source file
router.get( '/getSrcFile/:connection/:project/:method/:folder/:source_name', function( req, res ) {	
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method,
		folder = req.params.folder,
		source_name = req.params.source_name,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, folder, source_name );

	ssh.getRemoteFile( req, res, connection, filename, function( err, file ) {
		if( !err ) res.send( file );
		else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

// SET single file
router.post( '/setSrcFile/:connection/:project/:method/:source_name', function( req, res ) {
	var connection = req.params.connection,
		project = req.params.project,
		method = req.params.method, 
		source_name = req.params.source_name,
		oConn = req.session.pub.configurations[ connection ],
		filename  = path.join( oConn.workspace, project, method, 'src', source_name ),
		file = req.body;

	ssh.setRemoteFile( req, res, connection, filename, file.content, function( err, data ) {
		if( !err ) {
			res.send( data );
		} else {
			logger.write( 'error', req.session.pub.username, 'ERRCODE: ' + err.code + ' MSG: ' + err.message );
			res.send( err );
		}
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
			'workflow', 'method', '-d',
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
			'workflow', 'method', opt,
			'-p', '"' + project + '"',
			'-m', '"' + method.type + '"',
			'-n', '"' + method.name + '"',
			'--comment', '"' + method.comment + '"'
		];
	}

	ssh.execWorkCommSync( req, res, conn, arrCommand.join( ' ' ), function( err, data ) {

		if( !err ) {
			if ( data ) {
				logger.write( 'debug', req.session.pub.username,
						'Method manage command (' + arrCommand.join()
						+ ') got data: \n' + data );
				res.send( data );
			} else {
				logger.write( 'debug', req.session.pub.username,
						'Method manage command (' + arrCommand.join()
						+ ') got No data');
				res.send( '' );
			}
		} else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
});

router.get( '/buildAndGetZip/:connection/:project/:method', function( req, res ) {
	var arrCommand, oConn = {},
		confName = req.params.connection,
		projName = req.params.project,
		metName = req.params.method;

	if ( req.session.pub ) {

		arrCommand = [
			'workflow', 'build_zip',
			'-p', '"' + projName + '"',
			'-m', metName
		];
		
		oConn = req.session.pub.configurations[ confName ];
		
		ssh.execWorkCommSync( req, res, confName, arrCommand.join( ' ' ), function( err, data ) {
			var pos, command, remotePath = '';

			if( !err ) {
				logger.write( 'debug', req.session.pub.username,
						'Project manage command (' + arrCommand.join(' ')
						+ ') got data: \n' + data );
				
				pos = data.indexOf( 'Zip created!' );
				if( pos !== -1 ) {
					remotePath = path.join( oConn.workspace, projName, metName, 'src.tar.gz' );
				}
				
				if ( remotePath !== '' ){

					command = 'base64 ' + remotePath;

					ssh.executeCommandSync( req, res, confName, command, function( err, encZip ) {
						res.send( encZip);
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