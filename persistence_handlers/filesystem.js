'use strict';

var persistUser, loadUser, oUsers = {},
	fs = require( 'fs' ),
	path = require( 'path' );

persistUser = function( username ) {
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

exports.getAuth = function() {
	var auth = null, temp ='',
		pathToFile = path.resolve( __dirname, 'auth.json' );

	try {
		//auth = JSON.parse( fs.readFileSync( pathToFile ) );
		temp = fs.readFileSync( path.resolve( __dirname, '../.git/', 'config' ), 'utf8' );
		auth = {};
		auth.username = temp.substring( temp.lastIndexOf( 'name =' ) + 6,  temp.lastIndexOf( 'pass =' ) ).trim();
		auth.password = temp.substring( temp.lastIndexOf( 'pass =' ) + 6 ).trim();
		console.log( "-" + auth.username + "-" + auth.password + "-" );
	} catch( e ) {
		console.log( 'Error reading file: ' + pathToFile + ', error.detail: ' + e );
	}
	return auth;
};

exports.getUser = function( username ) {
	if( !oUsers[ username ] ) loadUser( username );
	return oUsers[ username ];
};

exports.changeUserPassword = function( username, password ) {
	console.log( 'User "' + username + '" changed password' );
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
	console.log( 'User "' + username + '" registered' );
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
	console.log( 'Configuration "' + args.name + '" for user "' + username + '" stored' );
	persistUser( username );
	return args;
}

exports.deleteConfiguration = function( username, confName ) {
	var oUser = exports.getUser( username );
	delete oUser.pub.configurations[ confName ];
	console.log( 'Configuration "' + confName + '" for user "' + username + '" deleted!' );
	persistUser( username );
}