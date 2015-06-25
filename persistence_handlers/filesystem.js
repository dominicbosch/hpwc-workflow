'use strict';

var persistUser, loadUser, oUsers = {},
	fs = require( 'fs' ),
	logger = require( '../modules/logger' ),
	path = require( 'path' );

persistUser = function( username ) {
	var pathToFile = path.resolve( __dirname, 'store_' + username + '.json' );

	if( !oUsers[ username ] ) {
		loadUser( username );
		if( !oUsers[ username ] )
			logger.write( 'error', username, 'You are trying to persist an unregistered user!' );
	}
	try {
		fs.writeFile( pathToFile, JSON.stringify( oUsers[ username ], null, 2 ) );
	} catch( e ) {
		logger.write( 'error', username,
						'Persisting failed! Your user object will not be stored!'
						+ e );
	}
};

loadUser = function( username ) {
	var pathToFile = path.resolve( __dirname, 'store_' + username + '.json' );
	try {
		oUsers[ username ] = JSON.parse( fs.readFileSync( pathToFile ) );
	} catch( e ) {
		logger.write( 'debug', username, e );
	}

};

exports.getUser = function( username ) {
	if( !oUsers[ username ] )
		loadUser( username );
	return oUsers[ username ];
};

exports.changeUserPassword = function( username, password ) {
	logger.write( 'info', username, 'Password changed!' );
	oUsers[ username ].password = password;
	persistUser( username );
};

exports.storeUser = function( username, password, privKey, pubKey ) {
	oUsers[ username ] = {
		pub: {
			username: username,
			socketID: username + '_' + (new Date()).getTime(),
			console: 'Welcome to the HPWC Workflow Manager!\n\n',
			configurations: {}
		},
		password: password,
		privateKey: privKey,
		publicKey: pubKey
	};
	logger.write( 'info', username, 'Registation successful!' );

	persistUser( username );
};

exports.getConfiguration = function( username, confname ) {
	var oUser = exports.getUser( username );
	return oUser.pub.configurations[ confname ];
}

exports.storeConfiguration = function( username, args ) {
	var oUser = exports.getUser( username );
	delete args.password;
	oUser.pub.configurations[ args.name ] = args;
	logger.write( 'info', username, 'Configuration "' + args.name + '" stored' );
	persistUser( username );
	return args;
}

exports.deleteConfiguration = function( username, confName ) {
	var oUser = exports.getUser( username );
	delete oUser.pub.configurations[ confName ];
	logger.write( 'info', username, 'Configuration "' + confName + '" deleted!' );
	persistUser( username );
}