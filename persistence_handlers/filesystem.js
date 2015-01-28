var persist,
	fs = require( 'fs' ),
	path = require( 'path' ),
	pathToFile = path.resolve( __dirname, '..', 'config', 'users.json' ),
	oUsers = JSON.parse( fs.readFileSync( pathToFile ) );

persist = function() {
	fs.writeFile( pathToFile, JSON.stringify( oUsers, null, 2 ) );
};

exports.getUser = function( name ) {
	return oUsers[ name ];
};

exports.storeUser = function( name, password ) {
	oUsers[ name ] = {
		user: {
			name: name,
			console: 'Welcome to the HPWC Workflow Manager!\n\n'
		},
		password: password
	};
	persist();
};

