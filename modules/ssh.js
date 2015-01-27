var fs = require( 'fs' ),
	path = require('path'),
	Connection = require( 'ssh2' ),
	oUserConnections = {},
	util = require('util');


exports.connectToHost = function( connObj, username, cb ) {

	var oConn = oUserConnections[  username ];
		
	if ( oConn && oConn[ '_state' ] !== 'closed' ) {
		oConn.end();
	} 
	
	oConn = new Connection();
	oConn.on( 'ready', function() {
		console.log( 'New SSH connection established for user ' +  username );
		oUserConnections[  username ] = oConn;
		cb(null, 'New SSH connection established for user ' +  username);
		//console.log( 'UTIL: ' + util.inspect(oConn, {showHidden: false, depth: null}));
	}).on( 'close', function() {
		if ( oConn[ '_state' ] !== 'closed' ) {
			oConn.destroy();
		}
		//console.log( 'CLOSE CONN: ' + oConn[ '_state' ]);
	}).connect({
		host: connObj.hosturl,
		port: connObj.port,
		username: connObj.username,
		privateKey: fs.readFileSync( path.join("users", username, ".ssh", "id_rsa"))
	});

//		oMyConn.conf = connObj.filename;
//		oMyConn.hostname = connObj.hostname;
//		oMyConn.workhome = connObj.workhome;
//		oMyConn.workspace = connObj.workspace;
//		oUserConnections[  username ] = oConn;
	//}
};

exports.createConnection = function( username ) {
	var oConn = oUserConnections[  username ];
	if( !oConn || oConn[ '_state' ] !== 'authenticated' ) {
		oConn = new Connection();
		oConn.on( 'ready', function() {
			console.log( 'New SSH connection established for user ' +  username );
		}).connect({
			host: 'cs-minta.cs.unibas.ch',
			port: 22,
			username: 'maffia',
			privateKey: fs.readFileSync( path.join("users", username, ".ssh", "id_rsa"))
		});
		oUserConnections[  username ] = oConn;
	}
};


executeCommand = function( username, command, cb ) {
	console.log( 'Processing user "' + username + '"s request: ',  command );

	var oConn = oUserConnections[ username ];

	//console.log(util.inspect(oConn, {showHidden: false, depth: null}));

	var alldata = '';

	if (oConn && oConn[ '_state' ] !== 'closed' ) {
		if (oConn[ '_state' ] === 'authenticated' ) {
			oConn.exec( command, function( err, stream ) {
				if ( err ) throw err;
				stream.on( 'exit', function( code, signal ) {
					console.log( 'Stream :: exit :: code: ' + code + ', signal: ' + signal );
				}).on( 'close', function() {
					console.log( 'Stream :: close');
					// oConn.end();
				}).on( 'data', function( data ) {
					//DO SOMETHING WITH DATA
					//console.log( 'STDOUT: ' + data );
					alldata += data;
				}).on( 'end', function( ) {
					
					//DO SOMETHING WITH DATA
					console.log( 'END ALL DATA: ', alldata );
					
					//send DATA back through Callback Function
					cb( alldata );
				}).stderr.on( 'data', function( data ) {
					console.log( 'STDERR: ' + data );
				});
			});
		} else {
			console.log( 'NO CONNECTION');
		cb ("NO CONNECTION");
		}
	} else {
		console.log( 'NO CONNECTION CREATED');
		cb ("NO CONNECTION CREATED");
	}
};

execWorkComm = function( session, command, cb ) {

	var user = session.user;
	var connection = session.connection;

	var oConn = oUserConnections[ user.name ];
	//console.log("UTIL: " + util.inspect(oConn, {showHidden: false, depth: null}));
	var sourceWork = 'source ' + path.join(connection.workhome, 'util', 'SetupEnv.sh') + 
		' ' + connection.workspace + '; ';
//	executeCommand( user.name, sourceWork + command, cb );

	command = sourceWork + command;

	console.log( 'Processing user "' + user.name + '" request: ',  command );

//	var oConn = oUserConnections[ user.name ];
	
	var alldata = '';
	//console.log(util.inspect(oConn, {showHidden: false, depth: null}));
	if (oConn && oConn[ '_state' ] !== 'closed' ) {
		if (oConn[ '_state' ] === 'authenticated' ) {
			oConn.exec( command, function( err, stream ) {
				if ( err ) throw err;
				stream.on( 'exit', function( code, signal ) {
					console.log( 'Stream :: exit :: code: ' + code + ', signal: ' + signal );
				}).on( 'close', function() {
					console.log( 'Stream :: close');
					// oConn.end();
				}).on( 'data', function( data ) {
					//DO SOMETHING WITH DATA
					//console.log( 'STDOUT: ' + data );
					alldata += data;
					
					//send DATA back through Callback Function
					//cb( data );
				}).on( 'end', function( ) {
					
					//DO SOMETHING WITH DATA
					console.log( 'END ALL DATA: ', alldata );
					
					//send DATA back through Callback Function
					cb( alldata );
				}).stderr.on( 'data', function( data ) {
					console.log( 'STDERR: ' + data );
				});
			});
		} else {
			console.log( 'NO CONNECTION');
		cb ("NO CONNECTION");
		}
	} else {
		console.log( 'NO CONNECTION CREATED');
		cb ("NO CONNECTION CREATED");
	}

};

exports.getRemoteFile = function( username, filename, cb ) {
	
	command = 'cat ' + filename;
	executeCommand( username, command, cb );

};

exports.closeConnection = function( username ) {
	
	var oConn = oUserConnections[  username ];

	if ( oConn && oConn[ '_state' ] !== 'closed' ) {
		oConn.end();
	}
};

exports.executeCommand = executeCommand;
exports.execWorkComm = execWorkComm;
