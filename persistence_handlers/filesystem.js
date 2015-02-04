'use strict';

var persist, strFile, oUsers,
	fs = require( 'fs' ),
	path = require( 'path' ),
	pathToFile = path.resolve( __dirname, 'users.json' );

persist = function() {
	try {
		fs.writeFile( pathToFile, JSON.stringify( oUsers, null, 2 ) );
	} catch( e ) {
		console.error( 'Persisting failed! Your user object will not be stored!' );
		console.error( e );
	}
};

try {
	strFile = fs.readFileSync( pathToFile );
	oUsers = JSON.parse( strFile );
} catch( e ) {
	console.log( 'Users object not existing, creating new one!' );
	oUsers = {};
	persist();
}

exports.getUser = function( username ) {
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
	persist();
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
	persist();
	return args;
}