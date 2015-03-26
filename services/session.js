'use strict';

var initStudent, createStudentConfig,
	authenticateStudent,
	express = require( 'express' ),
	persistence = global.persistence,
	keygen = require( 'ssh-keygen' ),
	https = require( 'https' ),
	http = require( 'http' ),
	socketio = require( '../modules/socket' ),
	ssh = require( '../modules/ssh' ),
	persistence = global.persistence,
	router = express.Router();

authenticateStudent = function( username, password, cb ) {

	/*var url = 'http://www.thomas-bayer.com/sqlrest/CUSTOMER/'; //build right url

    var requestREST = http.get( url, function ( response ) {
  
		var buffer = '';

		response.on( 'data', function ( chunk ) {
			buffer += chunk;
		}); 

		response.on( 'end', function ( err ) {
			console.log(buffer);
			console.log("\n");
			cb( null, 'OK' );
	    }); 
	});*/
	cb( null, 'OK' );
};

initStudent = function( username, password, cb ) {

	if ( persistence.getUser( username ) ) {
		cb({
			code: 0,
			message: 'User already existing!'
		});
	} else {
		keygen({
			location: __dirname + '/tmp_rsa',
			password: password,
			read: true,
			force: true,
			destroy: true,
			comment: 'workflow-' + username + '@nodejs-server'
		},function( err, out ) {
			if ( err ) {
				console.log( 'SSH-KEYGEN FAILED: ' + err );
				cb({
					code: 0,
					message: 'SSH-KEYGEN FAILED!'
				});
			} else {
				// console.log( 'SSH-KEYGEN successful!' );
				persistence.storeUser( username, password, out.key, out.pubKey );
				cb( null, 'New User "' + username + '" registered!' );
			}
		});
	}
};

createStudentConfig = function( req, username, password, cb ) {

	var errToSend = null;
	var msg = '';
	var serverName = [
			{	name: 'Minta',
				url: 'dmi-minta.dmi.unibas.ch'	},
			{	name: 'Mintb',
				url: 'dmi-mintb.dmi.unibas.ch'	},
			{	name: 'Mintc',
				url: 'dmi-mintc.dmi.unibas.ch'	},
			{	name: 'Mintd',
				url: 'dmi-mintd.dmi.unibas.ch'	},
		];

	var oUser = persistence.getUser( username ),
		baseConfig = {
			port: 22,
			username: username,
			password: password,
			workspace: '~/workspace',
			workhome: '/opt/workflow'
		},
		/*serverName = [
			{	name: 'Minta',
				url: 'i-minta'	},
			{	name: 'Mintb',
				url: 'i-mintb'	},
			{	name: 'Mintc',
				url: 'i-mintc'	},
			{	name: 'Mintd',
				url: 'i-mintd'	},
		],*/
		serverName = [
			{	name: 'Minta',
				url: 'dmi-minta.dmi.unibas.ch'	},
			{	name: 'Mintb',
				url: 'dmi-mintb.dmi.unibas.ch'	},
			{	name: 'Mintc',
				url: 'dmi-mintc.dmi.unibas.ch'	},
			{	name: 'Mintd',
				url: 'dmi-mintd.dmi.unibas.ch'	},
		],
		addConf = function( i ) {
			serverName[i].port = baseConfig.port;
			serverName[i].username = baseConfig.username;
			serverName[i].password = baseConfig.password;
			serverName[i].workspace = baseConfig.workspace;
			serverName[i].workhome = baseConfig.workhome;
			ssh.createConfiguration( username, serverName[i], false, function( err, oConf ) {
				if ( !err ) {
					req.session.pub.configurations[ oConf.name ] = oConf;
					console.log( serverName[i].name + ' OK!' );
				} else {
					if ( err.message !== 'Configuration already existing!' )
						errToSend = err
				}
				if ( i < serverName.length-1 ) {
					addConf( i + 1 );
				} else {
					if ( !errToSend ) {
						msg = 'OK';
					}

					cb ( errToSend, msg );
				}
			});
		}

	if ( oUser ) {

		addConf( 0 );

	} else {
		cb({
			code: 0,
			message: 'User not exists!'
		});
	}
};

router.post( '/login', function( req, res ) {

	authenticateStudent( req.body.username, req.body.tempPass, function( err, data ) {

		if ( !err && data === 'OK' ) {

			var oUser = persistence.getUser( req.body.username );

			if ( oUser ) { 
				req.session.pub = oUser.pub;
				createStudentConfig( req, req.body.username, req.body.tempPass, function( err, data ){
					if ( !err ) {
						console.log('SOCKETID: ' + req.session.pub.socketID );
						socketio.openSocket( req.session.pub.socketID );
						res.send( {
							err: null,
							msg: 'Login successful!'
						});
					} else {
						delete req.session.pub;
						res.send( {
							err: err,
							msg: 'Login failed!'
						} );
					}
				});
			} else {
				//create user
				initStudent( req.body.username, req.body.password, function( err, data ){
					if ( !err ) {

						oUser = persistence.getUser( req.body.username );

						req.session.pub = oUser.pub;

						//create configurations
						createStudentConfig( req, req.body.username, req.body.tempPass, function( err, data ){
							if ( !err ) {
								res.send( {
									err: null,
									msg: 'Login successful!'
								});
							} else {
								delete req.session.pub;
								res.send( {
									err: err,
									msg: 'Login failed!'
								} );
							}
						});
					} else {
						delete req.session.pub;
						res.send( {
							err: err,
							msg: 'Login failed!'
						} );
					}
				});
			}

		} else {
			res.status( 401 );
			res.send( 'Login failed!' );
		}
	});
});

router.post( '/logout', function( req, res ) {
	delete req.session.pub;
	res.send( 'Goodbye!' );
});

router.get( '/cleanProject', function( req, res ) {
	delete req.session.pub.selectedConnection.selectedProject;
	res.send( 'Project cleaned from session' );
});

router.get( '/cleanConnection', function( req, res ) {
	delete req.session.pub.selectedConnection;
	res.send( 'Connection cleaned from session' );
});

module.exports = router;