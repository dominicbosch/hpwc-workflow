'use strict';

var persist, loadUser, oUsers = {},
	fs = require( 'fs' ),
	path = require( 'path' );

persist = function( username ) {
	var pathToFile = path.resolve( __dirname, 'store_' + username + '.json' );

	if( !oUsers[ username ] ) {
		loadUser( username );
		if( !oUsers[ username ] ) console.error( 'You are trying to persist an unregistered user!');
	}
	try {
		fs.writeFile( pathToFile, JSON.stringify( oUsers[ username ], null, 2 ) );
	} catch( e ) {
		console.error( 'Persisting failed! Your user object will not be stored!' );
		console.error( e );
	}
};

loadUser = function( username ) {
	var pathToFile = path.resolve( __dirname, 'store_' + username + '.json' );
	try {
		oUsers[ username ] = JSON.parse( fs.readFileSync( pathToFile ) );
	} catch( e ) {
		console.log( 'User "' + username + '"\'s persistent file not existing!' );
	}

};

exports.getUser = function( username ) {
	if( !oUsers[ username ] ) loadUser( username );
	return oUsers[ username ];
};

exports.storeUser = function( username, password, privKey, pubKey ) {
	oUsers[ username ] = {
		pub: {
			username: username,
			console: 'Welcome to the HPWC Workflow Manager!\n\n',
			configurations: {}
		},
		password: password,
		privateKey: privKey,
		publicKey: pubKey
	};
	console.log( 'User "' + username + '" registered' );
	persist( username );
};

exports.getConfiguration = function( username, confname ) {
	var oUser = exports.getUser( username );
	return oUser.pub.configurations[ confname ];
}

exports.storeConfiguration = function( username, args ) {
	var oUser = exports.getUser( username );
	delete args.password;
	oUser.pub.configurations[ args.name ] = args;
	console.log( 'Configuration "' + args.name + '" for user "' + username + '" stored' );
	persist( username );
	return args;
}

exports.deleteConfiguration = function( username, confName ) {
	var oUser = exports.getUser( username );
	delete oUser.pub.configurations[ confName ];
	console.log( 'Configuration "' + confName + '" for user "' + username + '" deleted!' );
	persist( username );
}