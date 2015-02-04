'use strict';

var executeCommand, oUserConnections = {},
	connCounter = 1,
	fs = require( 'fs' ),
	path = require( 'path' ),
	SSHConnection = require( 'ssh2' ),
	util = require( 'util' ),
	persistence = global.persistence;

exports.getOpenConnections = function( username ) {
	var arr = [];
	for( var el in oUserConnections[ username ] ) {
		arr.push( el );
	}
	return arr;
};

exports.createConfiguration = function( username, args, cb ) {
	var cmd, oUser, oConn = new SSHConnection();

	if( persistence.getConfiguration( username, args.name ) ) {
		cb( new Error( 'Configuration already existing!' ) );
	} else {
		oConn.on( 'ready', function() {
			console.log( 'New temporary SSH connection %s@%s:%s, now: %s', args.username, args.url, args.port, connCounter++ );
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
			console.log( 'Closed temporary SSH connection %s@%s:%s, now: %s', args.username, args.url, args.port, --connCounter );
		}).connect({
			host: args.url,
			port: parseInt( args.port ) || 22,
			username: args.username,
			password: args.password
		});
	}
};

exports.connectToHost = function( username, connObj, cb ) {

	var oConn = oUserConnections[  username ];
	if ( oConn && oConn[ '_state' ] !== 'closed' ) {
		oConn.end();
	} 
	var oUser = persistence.getUser( username );
	oConn = new SSHConnection();
	oConn.on( 'ready', function() {
		console.log( 'New SSH connection established for user ' +  username );
		oUserConnections[ username ] = oConn;
		cb( null, 'New SSH connection established for user ' +  username);
		//console.log( 'UTIL: ' + util.inspect(oConn, {showHidden: false, depth: null}));
	}).on( 'close', function() {
		if ( oConn[ '_state' ] !== 'closed' ) {
			oConn.destroy();
		}
		//console.log( 'CLOSE CONN: ' + oConn[ '_state' ]);
	}).connect({
		host: connObj.url,
		port: connObj.port,
		username: connObj.username,
		privateKey: oUser.privateKey,
		passphrase: oUser.password
	});
};

// We pass req and res in order to handle all the error cases, so we don't need
// to handle them all in the services.
// IMPORTANT: This means if callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
executeCommand = function( req, res, connection, command, cb ) {

	var oConn, errString, alldata = '',
		username = req.session.pub.username,
		oConnections = oUserConnections[ username ];

	console.log( 'Processing user "' + username + '"s request: ',  command );
	errString = 'Command "%s" failed for user "%s": ';
	
	if( oConnections ) {
		oConn = oConnections[ connection ];
		if( oConn && oConn[ '_state' ] === 'authenticated' ) {
			oConn.exec( command, function( err, stream ) {
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
						alldata += data;
					}).on( 'end', function() {
						//send all data back through Callback Function
						cb( null, alldata );
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

// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.execWorkComm = function( req, res, connection, command, cb ) {
	var oConn, sourceWork = '',
		oConnections = oUserConnections[ username ],
		username = req.session.pub.username;

	if( oConnections ) {
		oConn = oConnections[ connection ];
		if( oConn ) {
			sourceWork = 'source ' + path.join( oConn.workhome, 'util', 'SetupEnv.sh' )
				+ ' ' + oConn.workspace + '; ';
		}
	}
	// We don't need an else because these cases are handled in the executeCommand
	executeCommand( req, res, connection, sourceWork + command, cb );
};

// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteJSON = function( req, res, connection, filename, cb ) {
	executeCommand( req, res, connection, 'cat ' + filename, function( err, data ) {
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

// This is a general handler for retrieved lists of the same format
// IMPORTANT: If callback function 'cb' receives an error as an argument
//            no further response can be sent to the client!!!
exports.getRemoteList = function( req, res, connection, command, cb ) {
	executeCommandff( req, res, connection, command, function( err, data ) {
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

exports.closeConnection = function( username, connection ) {
	var oConn, oConns = oUserConnections[ username ];

	if ( oConns ) {
		oConn = oConns[ connection ];
		if( oConn ) {
			oConn.end();
			delete oUserConnections[  username ][ connection ];
			return true;
		}
		else return false;
	}
	else return false;
};
