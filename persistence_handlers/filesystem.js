var persist, strFile,
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

exports.storeUser = function( username, password ) {
	oUsers[ username ] = {
		pub: {
			username: username,
			console: 'Welcome to the HPWC Workflow Manager!\n\n',
			configurations: {}
		},
		password: password
	};
	persist();
};

