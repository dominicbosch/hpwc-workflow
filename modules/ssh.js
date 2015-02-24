'use strict';

var executeCommandSync, oUserConnections = {},
	executeCommand, tempConnCounter = 0, connCounter = 0,
	execWorkCommSync, execWorkComm,
	fs = require( 'fs' ),
	path = require( 'path' ),
	SSHConnection = require( 'ssh2' ).Client,
	util = require( 'util' ),
	persistence = global.persistence;

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

exports.getFile = function( req, res, connection, remotePath, localPath, cb ) {

	var oConn, errString,
		username = req.session.pub.username,
		oConnections = oUserConnections[ username ];

	console.log( 'Processing user "' + username + '"s request: getFile' );
	errString = 'Command "%s" failed for user "%s": ';

	if( oConnections ) {
		oConn = oConnections[ connection ];
		if( oConn ) {

			oConn.sftp( function (err, sftp) {
				if (err) {
					console.log( 'err1' );
					throw err;
				}
				sftp.fastGet( remotePath, localPath, function ( err ) {
					cb( err ? new Error( "Can't read file" ) : localPath );
					console.log( err ? "Could not read. " : "Read." );
				});
			});
		} else {
			console.error( errString + 'Connection "%s" is not ready!', command, username, connection );
			res.status( 400 );
			res.send( 'The connection "' + connection + '" is not ready!' );
			cb( new Error( 'The connection "' + connection + '" is not ready!' ) );
		}
	} else {
		console.error( errString + 'No open connections!', command, username );
		res.status( 400 );
		res.send( 'User has no open connections!' );
		cb( new Error( 'User has no open connections!' ) );
	}

	return false;
};

exports.createConfiguration = function( username, args, force, cb ) {
	var cmd, oUser, oConn = new SSHConnection();

	if( !force && persistence.getConfiguration( username, args.name ) ) {
		cb( new Error( 'Configuration already existing!' ) );
	} else {
		oConn.on( 'ready', function() {
			console.log( 'New temporary SSH connection %s@%s:%s, now: %s', args.username, args.url, args.port, ++tempConnCounter );
			oUser = persistence.getUser( username );
			cmd = 'mkdir -p ~/.ssh && echo "' + oUser.publicKey + '" >> ~/.ssh/authorized_keys && echo "OK!"';
			oConn.exec( cmd, function( err, stream ) {
				var oConf, data = '';
				if ( err ) {
					console.error( err );
					cb( err );
				} else {
					stream.on( 'data', function( chunk ) { data += chunk; })
						.on( 'end', function() {
							oConn.end();
							if( data === 'OK!\n' ) {
								args.port = parseInt( args.port ) || 22;
								oConf = persistence.storeConfiguration( username, args );
								cb( null, oConf );
							} else {
								cb( new Error( data ) );
							}
						})
						.stderr.on( 'data', function( data ) {
							// Handles errors that happen on the other end of this connection
							console.log( 'Error: ' + data );
						});
				}
			});
		}).on( 'close', function() {
			console.log( 'Closed temporary SSH connection %s@%s:%s, now: %s', args.username, args.url, args.port, --tempConnCounter );
		}).on( 'error', function( e ) {
			console.log( 'Error connecting "'+args.username+'@'+args.url+':'+args.port+'": ' + e.code );
			cb( new Error( 'Error connecting "'+args.username+'@'+args.url+':'+args.port+'": ' + e.code ) );
		}).connect({
			host: args.url,
			port: parseInt( args.port ) || 22,
			username: args.username,
			password: args.password
		});
	}
};

exports.updateConfiguration = function( username, args, cb ) {
	var oUser, oConf, oConn, oConns = oUserConnections[ username ],
		conf = persistence.getConfiguration( username, args.name ) ;

	if( !conf ) {
		cb( new Error( 'Configuration not existing!' ) );
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

exports.deleteConfiguration = function( username, confName, cb ) {
	var conf = persistence.getConfiguration( username, confName );

	if( !conf ) {
		cb( new Error( 'Configuration not existing!' ) );
	} else {
		exports.closeConnection( username, confName );
		persistence.deleteConfiguration( username, confName );
		cb( null );
	}

};

exports.connectToHost = function( username, connObj, cb ) {

	var oConn = {};

	if ( !oUserConnections[ username ] ) {
		oUserConnections[ username ] = {};
	} 
 
	oConn = oUserConnections[ username ][ connObj.name ];

	if ( !oConn ) {
		var oUser = persistence.getUser( username );
		oConn = new SSHConnection();
		oConn.on( 'ready', function() {
			console.log( 'New SSH connection established to "' + connObj.name
					+ '" for user "' + username + '", #openConnections='+(++connCounter));
			oUserConnections[ username ][ connObj.name ] = oConn;
			cb( null, 'New SSH connection established for user ' + username);
			//console.log( 'UTIL: ' + util.inspect(oConn, {showHidden: false, depth: null}));
		}).on( 'close', function() {
			delete oUserConnections[ username ][ connObj.name ];
			console.log( 'SSH connection closed from "' + connObj.name
					+ '" for user "' + username + '", #openConnections='+(--connCounter));
		}).on( 'end', function() {
			delete oUserConnections[ username ][ connObj.name ];
			console.log( 'SSH connection ENDED from "' + connObj.name
					+ '" for user "' + username + '", #openConnections='+(connCounter));
		}).on( 'error', function( e ) {
			delete oUserConnections[ username ][ connObj.name ];
			console.log( 'Error connecting (#'+(++connCounter)+') "'+connObj.username+'@'+connObj.url+':'+connObj.port+'": ' + e.code );
			cb( new Error( 'Error connecting "'+connObj.username+'@'+connObj.url+':'+connObj.port+'": ' + e.code ) );
		}).connect({
			host: connObj.url,
			port: connObj.port,
			username: connObj.username,
			privateKey: oUser.privateKey,
			passphrase: oUser.password
		});
	} else {
		cb( null, 'Connection already open for user ' + username);
	}
};

// We pass req and res in order to handle all the error cases, so we don't need
// to handle them all in the services.
// IMPORTANT: This means if callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.executeCommand = executeCommand = function( req, res, connection, command, cb ) {

	var oConn, errString,
		username = req.session.pub.username,
		oConnections = oUserConnections[ username ];

	console.log( 'Processing user "' + username + '"s request: ',  command );
	errString = 'Command "%s" failed for user "%s": ';

	if( oConnections ) {
		oConn = oConnections[ connection ];

		if( oConn ) {

			oConn.exec( command, function( err, stream ) {
				oConn.on( 'close', function(){
					cb( null, 'Connection closed' );
					stream.end();
					console.log('Deleting stream');
				});
				if ( err ) {
					// We do not take any further actions if an error ocurred here
					console.error( errString + 'Execution error!', command, username );
					console.error( err );
					res.status( 400 );
					res.send( 'Execution of remote command failed!' );
					cb( err );
				} else {
					stream.on( 'data', function( data ) {
						// Add chunks to data string and wait until the end of the stream
						cb( null, data );
					}).on( 'end', function() {
						//send all data back through Callback Function
						cb( null, false );
					}).on( 'error', function(e) {
						console.error(e);
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
			console.error( errString + 'Connection "%s" is not ready!', command, username, connection );
			res.status( 400 );
			res.send( 'The connection "' + connection + '" is not ready!' );
			cb( new Error( 'The connection "' + connection + '" is not ready!' ) );
		}
	} else {
		console.error( errString + 'No open connections!', command, username );
		res.status( 400 );
		res.send( 'User has no open connections!' );
		cb( new Error( 'User has no open connections!' ) );
	}
};

exports.executeCommandSync = executeCommandSync = function( req, res, connection, command, cb ) {

	var alldata = '';

	executeCommand( req, res, connection, command, function( err, data ) {
		if ( !err ) {
			if ( data )
				alldata += data;
			else
				cb( null, alldata);
		} else {
			cb( err, alldata );
		}
	});
};

exports.execWorkCommSync = execWorkCommSync = function( req, res, connection, command, cb ) {
	
	var conn = req.session.pub.configurations[ connection ];
				
	command = 'source ' + path.join( conn.workhome, 'util', 'SetupEnv.sh' )	
			+ ' ' + conn.workspace + '; ' + command;

	executeCommandSync( req, res, connection, command, cb );
};

exports.execWorkComm = execWorkComm = function( req, res, connection, command, cb ) {
	
	var conn = req.session.pub.configurations[ connection ];
				
	command = 'source ' + path.join( conn.workhome, 'util', 'SetupEnv.sh' )	
			+ ' ' + conn.workspace + '; ' + command;

	executeCommand( req, res, connection, command, cb );
};

// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteJSON = function( req, res, connection, filename, cb ) {
	
	executeCommandSync( req, res, connection, 'cat ' + filename, function( err, data ) {
		if( !err ) {
			try {
				cb( null, JSON.parse( data ) );
			} catch( e ) {
				console.error( 'JSON corrupt: ' + filename );
				res.status( 400 );
				res.send( 'JSON corrupt!' );
				cb( e );
			}
		}
	});
};

exports.getRemoteFile = function( req, res, connection, filename, cb ) {
	
	executeCommandSync( req, res, connection, 'cat ' + filename, function( err, data ) {
		if( !err ) {
			cb( null, data );
		}
	});
};

exports.setRemoteFile = function( req, res, connection, filename, content, cb ) {
	
	executeCommandSync( req, res, connection, 'echo "' + content + '" > ' + filename, function( err, data ) {
		if( !err ) {
			cb( null, data );
		}
	});
};

// This is a general handler for retrieved lists of the same format
// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteList = function( req, res, connection, command, cb ) {
	
	execWorkCommSync( req, res, connection, command, function( err, data ) {
		var pos, list = '';

		if( !err ) {
			pos = data.indexOf( ':' );
			if( pos !== -1 ) {
				list = data.substring( pos + 1 ).trim().split( ' ' );
			} 
			console.log( 'Get list from file "' + command + '": ' + list );
			cb( null, list );
		}
	});
};

exports.getAndSendRemoteList = function( req, res, connection, command ) {
	exports.getRemoteList( req, res, connection, command, function( err, list ) {
		if( !err ) res.send( list );
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
