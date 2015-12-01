'use strict';

var oUserConnections = {}, oUserLogs = {},
	getLog, executeCommand, killCommand,
	executeCommandSync, executeCommandAndEmit,
	execWorkCommSync, execWorkCommAndEmit,
	tempConnCounter = 0, connCounter = 0
	, fs = require( 'fs' )
	, path = require( 'path' )
	, SSHConnection = require( 'ssh2' ).Client
	, util = require( 'util' )
	, logger = require( './logger' )(module.filename)
	, socketio = require( './socket' )
	, persistence = global.persistence
	;

exports.getOpenConnections = function( username ) {
	var arr = [];
	for( var el in oUserConnections[ username ] ) {
		arr.push( el );
	}
	return arr;
};

exports.isConnOpen = function( username, connName ) {

	if ( oUserConnections[ username ] ) {
		if (oUserConnections[ username ][ connName ]) {
			return true;
		}
	}

	return false;
};

exports.createConfiguration = function( username, args, force, cb ) {
	var cmd, oUser, oConn = new SSHConnection(), errorHappened = false;

	if( !force && persistence.getConfiguration( username, args.name ) ) {
		cb({
			code: 0,
			message: 'Configuration already existing!'
		});
	} else {
		oConn.on( 'ready', function() {

			logger.formattedWrite( 'info', username,
									'New temporary SSH connection %s@%s:%s, now: %s',
									args.username, args.url, args.port, ++tempConnCounter );

			oUser = persistence.getUser( username );
			//cmd = 'grep "' + oUser.publicKey + '" ~/.ssh/authorized_keys';
			cmd = 'less ~/.ssh/authorized_keys';
			oConn.exec( cmd, function( err, stream ) {
				var oConf, data = '';
				if ( err ) {
					logger.write( 'error', username,
									'Can\'t execute command: ' + cmd + err );
					cb({
						code: 0,
						message: 'Can\'t execute command: ' + cmd + err
					});
				} else {
					stream.on( 'data', function( chunk ) {
						logger.write( 'trace', username,
									'Command "' + cmd + '" got data: ' + chunk.toString() );
						data += chunk;
					})
					.on( 'end', function() {
						if ( data.toString().indexOf( oUser.publicKey ) > -1 ) {
							logger.write( 'trace', username, 'SSH KEY already stored! Let\'s store the configuration!' );
							args.port = parseInt( args.port ) || 22;
							oConf = persistence.storeConfiguration( username, args );
							cb( null, oConf );
						} else { //if ( data === '' ) or different
							logger.write( 'trace', username, 'SSH KEY not stored yet... Let\'s store it!' );
							cmd = 'mkdir -p ~/.ssh && echo "' + oUser.publicKey + '" >> ~/.ssh/authorized_keys ';//&& echo "OK!"';
							oConn.exec( cmd, function( err, stream ) {
								if ( err ) {
									logger.write( 'error', username,
													'Can\'t execute command: ' + cmd + err );
									cb({
										code: 0,
										message: 'Can\'t execute command: ' + cmd + err
									});
								} else {
									stream.on( 'data', function( chunk ) {
										logger.write( 'trace', username,
													'Command "' + cmd + '" got data: ' + chunk.toString() );
										data += chunk;
									})
									.on( 'end', function() {
										//if( data === 'OK!\n' ) {
											args.port = parseInt( args.port ) || 22;
											oConf = persistence.storeConfiguration( username, args );
											cb( null, oConf );
										//} else {
										//	cb({
										//		code: 0,
										//		message: data
										//	});
										//}
									})
									.stderr.on( 'data', function( data ) {
										// Handles errors that happen on the other end of this connection
										logger.write( 'error', username, data );
										cb({
											code: 2,
											message: data
										});
									});
								}
							});
						}
					})
					.stderr.on( 'data', function( data ) {
						// Handles errors that happen on the other end of this connection
						logger.write( 'error', username, data );
						//errorHappened = true;
					});
				}
			});
		}).on( 'close', function() {
			logger.formattedWrite( 'debug', username,
									'Closed temporary SSH connection %s@%s:%s, now: %s',
									args.username, args.url, args.port, --tempConnCounter );
		}).on( 'error', function( e ) {
			var msg = 'Error connecting "'+args.username+'@'+args.url+':'+args.port+'": ' + e;//.code;
			logger.write( 'error', username, msg );
			cb({
				code: 0,
				message: msg
			});
		}).connect({
			host: args.url,
			port: parseInt( args.port ) || 22,
			username: args.username,
			password: args.password,
			debug: function( stream ) {
				logger.write( 'debug', username, stream );
			}
		});
	}
};

exports.updateConfiguration = function( username, args, cb ) {
	var oUser, oConf, oConn, oConns = oUserConnections[ username ],
		conf = persistence.getConfiguration( username, args.name ) ;

	if( !conf ) {
		cb({
			code: 0,
			message: 'Configuration not existing!'
		});
	} else {
		exports.closeConnection( username, args.name );
		oUser = persistence.getUser( username );
		args.password = oUser.password;
		if( conf.username !== args.username || conf.url !== args.url || conf.port !== args.port ) {
			// We need to create a new configuration because major properties changed
			exports.createConfiguration( username, args, true, cb );

			// we need to return here since createConfiguration has its own callback handling:
			return;
		}
		oConf = persistence.storeConfiguration( username, args );
		cb( null, oConf );
	}

};

exports.deleteConfiguration = function( username, confObj, cb ) {
	var conf = persistence.getConfiguration( username, confObj.name );
	var oConn, oUser, cmd;

	if( !conf ) {
		cb({
			code: 0,
			message: 'Configuration not existing!'
		});
	} else {
		//check if other configuration to same machine exists //not for now

		//check if want to delete the related key
		if ( confObj.deleteKey === true ) {
			//connect to clear ssh keys
			exports.connectToHost ( username, conf, function( err, msg ) {
				if( !err ) {
					logger.write( 'info', username, 'No error connecting, msg: ' + msg );
					if ( oUserConnections[ username ] ) {
						logger.write( 'info', username, 'In IF' );
						oConn = oUserConnections[ username ][ confObj.name ];
					}
					oUser = persistence.getUser( username );

					if( oConn ) { //if connection exists
					
						cmd = 
							'if test -f $HOME/.ssh/authorized_keys; then '
								+ 'if grep -v "' + oUser.publicKey + '" $HOME/.ssh/authorized_keys > $HOME/.ssh/tmp; then '
									+ 'cat $HOME/.ssh/tmp > $HOME/.ssh/authorized_keys && rm $HOME/.ssh/tmp; '
								+ 'else '
									+ 'rm $HOME/.ssh/authorized_keys && rm $HOME/.ssh/tmp; '
								+ 'fi; '
							+ 'fi';
						
						//cmd = 'cat $HOME/.ssh/authorized_keys';
						oConn.exec( cmd, function( err, stream ) {
							var data = '';
							if ( err ) {
								logger.formattedWrite( 'error', username,
												'Can\'t execute command: %s For deleting ssh connection key. %s',
												cmd, err );
								exports.closeConnection( username, confObj.name );
								cb({
									code: 0,
									message: 'Can\'t execute command: ' + cmd + 'For deleting connection ssh key' + err
								});
							} else {
								logger.write( 'debug', username, 'No error' );
								stream.on( 'data', function( chunk ) {
									logger.formattedWrite( 'trace', username,
												'Command: %s, got data: %s', cmd, chunk );
									data += chunk;
								})
								.on( 'end', function() {
									var msg = 'Delete key command received: ';
									if ( data !== "" ) {
										msg += data;
										logger.write( 'trace', username, msg );
										exports.closeConnection( username, confObj.name );
										cb({
											code: 0,
											message: msg
										});
									} else { //if ( data === '' ) or different
										msg += "NO DATA as expected";
										logger.write( 'trace', username, msg );
										persistence.deleteConfiguration( username, confObj.name );
										exports.closeConnection( username, confObj.name );
										cb( null );
									}
								})
								.stderr.on( 'data', function( data ) {
									// Handles errors that happen on the other end of this connection
									logger.write( 'error', username, data );
									exports.closeConnection( username, confObj.name );
									cb({
										code: 2,
										message: data
									});
								});
							}
						});
					}
				} else {
					var msg = 'Error connecting to ' + confObj.name;
					logger.write( 'error', username, msg );
					cb({
						code: 0,
						message: msg
					});
				}
			});
		} else {
			persistence.deleteConfiguration( username, confObj.name );
			exports.closeConnection( username, confObj.name );
			cb( null );
		}

		
	}
};

exports.connectToHost = function( username, connObj, cb ) {
	var oConn = {};

	if ( !oUserConnections[ username ] ) {
		oUserConnections[ username ] = {};
		oUserLogs[ username ] = {};
	}
 
 	if ( connObj ) {
		oConn = oUserConnections[ username ][ connObj.name ];

		if ( !oConn ) {
			var oUser = persistence.getUser( username );
			oConn = new SSHConnection();
			oConn.on( 'ready', function() {

				logger.write( 'debug', username,
								'New SSH connection established to "' + connObj.name
								+ '", #openConnections='+(++connCounter));

				oUserConnections[ username ][ connObj.name ] = oConn;

				//create object to store log information
				oUserLogs[ username ][ connObj.name ]= {};

				cb( null, 'New SSH connection established for user ' + username);
				//console.log( 'UTIL: ' + util.inspect(oConn, {showHidden: false, depth: null}));
			}).on( 'close', function() {
				delete oUserConnections[ username ][ connObj.name ];
				logger.write( 'debug', username,
								'SSH connection closed from "' + connObj.name
								+ '", #openConnections='+(--connCounter));
			}).on( 'end', function() {
				delete oUserConnections[ username ][ connObj.name ];
				logger.write( 'debug', username,
								'SSH connection ENDED from "' + connObj.name
								+ '", #openConnections='+(connCounter));
			}).on( 'error', function( e ) {
				delete oUserConnections[ username ][ connObj.name ];
				var msg = 'Error connecting (#'+(++connCounter)+') "' + connObj.username
							+ '@' + connObj.url + ':' + connObj.port + '": ' + e.code;

				logger.write( 'error', username, msg );

				cb({
					code: 0,
					message: msg
				});
			}).connect({
				host: connObj.url,
				port: connObj.port,
				username: connObj.username,
				privateKey: oUser.privateKey,
				passphrase: oUser.password
			});
		} else {
			// TODO: why is this not returning an error?
			cb( null, 'Connection already open for user ' + username);
		}
	} else {
		var msg = 'Connection Object not specified';

		logger.write( 'error', username, msg );

		cb({
			code: 0,
			message: msg
		});
	}
};

// We pass req and res in order to handle all the error cases, so we don't need
// to handle them all in the services.
// IMPORTANT: This means if callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
executeCommand = function( req, res, connection, command, project, cb ) {
	var oConn, errString, alldata = '', objToSend = {}, dataString,
		processData, errorHappened = false, pos = -1,
		username = req.session.pub.username,
		oConnections = oUserConnections[ username ];

	logger.write( 'debug', username, 'Processing user request: ' + command);

	errString = 'Command "%s" failed for user "%s": ';

	if( oConnections ) {
		oConn = oConnections[ connection ];

		if( oConn ) {
			//add code to store id
			//start here
			if ( project ) {
				command = 'echo "PID: $$"; '
						+ 'echo "STARTTIME: $(ps -p $$ -o lstart | sed -n \'2p\')"; '
						+ command;
			}
			//end here
			oConn.exec( command, function( err, stream ) {
				if ( err ) {
					// We do not take any further actions if an error ocurred here
					logger.write( 'error', username,
						'Command "' + command + '" failed!'
						+ err );
					res.status( 400 );
					res.send( 'Execution of remote command failed!' );
					cb({
						code: 1,
						message: err.toString()
					});
				} else {
					if ( project ) {
						//set activeProject
						oUserLogs[ username ][ connection ][ 'activeProject' ] = project;
						//create log object
						oUserLogs[ username ][ connection ][ project ] = {
							  pid: null
							, start: null
							, content: ''
							, count: -2
						};
						logger.write( 'debug', username, 'IN if and project: ' + project );
						cb( null, true );
					}
					
					processData = function( data ) {
						logger.write( 'debug', username, 'Received data for project: ' + data );

						if ( project ) {
							if ( oUserLogs[ username ][ connection ][ project ][ 'count' ] < 0 ) {
								//check pid and start time
								dataString = data.toString();
								if ( oUserLogs[ username ][ connection ][ project ][ 'count' ] == -2 ) {
									//SEARCH PID
									pos = dataString.indexOf( 'PID:' );
									if ( pos !== -1 ) {
										//PID found
										oUserLogs[ username ][ connection ][ project ][ 'pid' ] = parseInt(dataString.substr(pos+4+1));
										logger.write( 'debug', username, '-' + dataString + '-' );
										logger.write( 'debug', username, '-' + oUserLogs[ username ][ connection ][ project ][ 'pid' ] + '-' );
									} else {
										//ERROR SEARCHING PID
										//oUserLogs[ username ][ connection ][ project ][ 'pid' ] = 'PID not found in reply';
									}
									//update count
									oUserLogs[ username ][ connection ][ project ][ 'count' ] = -1;
									//reset pos maybe not needed
									pos = -1;
								} else {
									//SEARCH STARTTIME
									pos = dataString.toString().indexOf( 'STARTTIME:' );
									if ( pos !== -1 ) {
										//STARTTIME found
										oUserLogs[ username ][ connection ][ project ][ 'start' ] = dataString.substr(pos+10+1).trim();
										logger.write( 'debug', username, '-' + dataString + '-' );
										logger.write( 'debug', username, '-' + oUserLogs[ username ][ connection ][ project ][ 'start' ] + '-' );
									} else {
										//ERROR SEARCHING STARTTIME
										//oUserLogs[ username ][ connection ][ project ][ 'start' ] = 'STARTTIME not found in reply';
									}
									//update count
									oUserLogs[ username ][ connection ][ project ][ 'count' ] = 0;
									//reset pos maybe not needed
									pos = -1;
								}
							} else {
								//add to log
								oUserLogs[ username ][ connection ][ project ][ 'content' ] += data;
								objToSend = {
									project: project,
									type: 'data',
									msg: data.toString(),
									count: ++oUserLogs[ username ][ connection ][ project ][ 'count' ]
								}
								logger.write( 'debug', username,
												'Send in Room: ' + data
												+ '\n COUNT: ' + oUserLogs[ username ][ connection ][ project ][ 'count' ] );
								//send to client
								socketio.sendInRoom( req.session.pub.socketID, connection, objToSend );
							}
						} else {
							// Add chunks to data string and wait until the end of the stream
							alldata += data;
						}
					};

					stream.on( 'data', processData )
					.on( 'end', function() {
						//send all data back through Callback Function
						logger.write( 'debug', username, 'STREAM ENDED' );
						if ( project ) {

							objToSend = {
								project: project,
								type: 'endData',
								msg: '',
								count: oUserLogs[ username ][ connection ][ project ][ 'count' ]
							}
							//send null number
							socketio.sendInRoom( req.session.pub.socketID, connection, objToSend );
							
							//empty activeProject
							delete oUserLogs[ username ][ connection ][ 'activeProject' ];

						}
						else if( errorHappened )
							cb({
								code: 2,
								message: alldata
							});
						else 
							cb( null, alldata );
					}).on( 'error', function(e) {
						logger.write( 'error', username, e );
						cb({
							code: 0,
							message: e.toString()
						});
					}).stderr.on( 'data', function( data ) {
						errorHappened = true;
						processData( data );
					});

					// // TODO: Since we do not handle these cases we can delete all event listeners here below
					// .on( 'close', function() {
					// 	console.log( 'Stream :: close for command "' + command + '"' );
					// }).on( 'exit', function( code, signal ) {
					// 	console.log( 'Stream :: exit :: ('+code+', '+signal+') for command "' + command + '"' );
					// }).stderr.on( 'data', function( data ) {
					// 	// Handles errors that happen on the other end of this connection
					// 	console.log( 'STDERR: ' + data );
					// });
				}
			});
		} else {
			logger.write( 'error', username,
						'Command "' + command + '" failed!'
						+ 'Connection "' + connection + '" is not ready!' );
			res.status( 400 );
			res.send( 'The connection "' + connection + '" is not ready!' );
			cb({
				code: 1,
				message: 'Connection "' + connection + '" is not ready!'
			});
		}
	} else {
		logger.write( 'error', username,
						'Command "' + command + '" failed!'
						+ 'No open connections!' );
		res.status( 400 );
		res.send( 'User has no open connections!' );
		cb({
			code: 1,
			message: 'User has no open connections!'
		});
	}
};

exports.executeCommandSync = executeCommandSync = function( req, res, connection, command, cb ) {
	executeCommand( req, res, connection, command, null, cb );
};

exports.executeCommandAndEmit = executeCommandAndEmit = function( req, res, connection, project, command, cb ) {
	var message = '',
		username = req.session.pub.username;

	logger.write( 'debug', username, 'Project: ' + project
					+ ' - Active: ' + oUserLogs[ username ][ connection ][ 'activeProject' ] );

	if ( project && oUserLogs[ username ][ connection ][ 'activeProject' ] ) {

		message = 'Wait until the previous command is finished\n';

		if ( oUserLogs[ username ][ connection ][ 'activeProject' ] !== project ) {
			message += 'Project "' + oUserLogs[ username ][ connection ][ 'activeProject' ]
						+ '" still busy select it to check the status';
		}
		//activeProject for the connection... re-try later
		cb( null, message );
	} else {
		executeCommand( req, res, connection, command, project, cb );
	}
};

exports.execWorkCommSync = execWorkCommSync = function( req, res, connection, command, cb ) {
	var conn = req.session.pub.configurations[ connection ];

	command = 'source ' + path.join( conn.workhome, 'util', 'BaseSetup.sh' )
			+ ' ' + conn.workspace + '; ' + command;
	executeCommandSync( req, res, connection, command, cb );
};

exports.execWorkCommAndEmit = execWorkCommAndEmit = function( req, res, connection, project, command, cb ) {
	var conn = req.session.pub.configurations[ connection ];
				
	command = 'source ' + path.join( conn.workhome, 'util', 'BaseSetup.sh' )
			+ ' ' + conn.workspace + '; ' + command;
	executeCommandAndEmit( req, res, connection, project, command, cb );
};

exports.killCommand = killCommand = function( req, res, cb ) {

	var command, killed = false,
		username = req.session.pub.username,
		connection = req.params.connection,
		project = req.params.project,
		start, pid;

	if ( oUserLogs[ username ]
		&& oUserLogs[ username ][ connection ]
		&& ( oUserLogs[ username ][ connection ][ 'activeProject' ] === project )
		&& oUserLogs[ username ][ connection ][ project ] ) {

		start =  oUserLogs[ username ][ connection ][ project ][ 'start' ].trim();
		pid = oUserLogs[ username ][ connection ][ project ][ 'pid' ];

		command = 'if [ "' + start + '" == ' + '"$(ps -p ' + pid + ' -o lstart | sed -n \'2p\')" ]; '
				+ 'then '
					+ '$(pkill -g ' + pid + '); echo "process killed"; '
				+ 'else '
					+ 'echo "cannot kill process"; '
				+ 'fi';

		logger.write( 'debug', username, 'Try to kill command for: ' + project );

		executeCommandSync( req, res, connection, command, cb );

	} else {
		cb({
			code: 0,
			message: 'No process to kill'
		});
	}
};

exports.getLog = getLog = function( username, connection, project, cb ) {

	var log = {
		content: '',
		active: false,
		count: 0
	};

	//if log exists
	if ( oUserLogs[ username ]
		&& oUserLogs[ username ][ connection ]
		&& oUserLogs[ username ][ connection ][ project ] ) {

		log = oUserLogs[ username ][ connection ][ project ];

		//activeProject not exist or it's different
		if ( project === oUserLogs[ username ][ connection ][ 'activeProject' ] ) {
			log.active = true;
		} else {
			log.active = false;
		}
	}

	cb( log );
};

// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteJSON = function( req, res, connection, filename, cb ) {
	executeCommandSync( req, res, connection, 'cat ' + filename, function( err, data ) {
		if( err ) cb( err );
		else {
			try {
				cb( null, JSON.parse( data ) );
			} catch( e ) {
				logger.write( 'error', req.session.pub.username, 'JSON corrupt: ' + filename );
				res.status( 400 );
				res.send( 'JSON corrupt!' );
				cb({
					code: 1,
					message: e.toString()
				});
			}
		}
	});
};

exports.getRemoteFile = function( req, res, connection, filename, cb ) {
	executeCommandSync( req, res, connection, 'cat ' + filename, cb );
};

exports.setRemoteFile = function( req, res, connection, filename, content, cb ) {	
	content = content.replace( /'/g, "'\"'\"'");//.replace( /"/g, '\\"');
	executeCommandSync( req, res, connection, "echo '" + content + "' > " + filename, cb );
};

// This is a general handler for retrieved lists of the same format
// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteList = function( req, res, connection, command, type, cb ) {
	
	execWorkCommSync( req, res, connection, command, function( err, data ) {
		var pos, list = '';

		if ( err )
			cb( err );
		else {
			pos = data.lastIndexOf( type + ':' );
			if ( ( pos !== -1 ) && 
				 ( data.substring( pos + type.length + 2, pos + type.length + 3 ) !== "\n" ) ) {
				list = data.substring( pos + type.length + 1 ).trim().split( ' ' );
			}
			logger.write( 'debug', req.session.pub.username, 'Get list from file "' + command + '": ' + list );
			cb( null, list );
		}
	});
};

exports.getAndSendRemoteList = function( req, res, connection, command, type ) {
	exports.getRemoteList( req, res, connection, command, type, function( err, list ) {
		if( !err ) res.send( list );
		else if( err.code !== 1 ) {
			res.status( 400 );
			res.send( err.message );
		}
	});
};

exports.closeConnection = function( username, confName ) {
	var oConn, oConns = oUserConnections[ username ];

	if ( oConns ) {
		oConn = oConns[ confName ];
		if( oConn ) {
			oConn.end();
			delete oUserConnections[ username ][ confName ];
			return true;
		}
		else return false;
	}
	else return false;
};
