var bunyan = require( 'bunyan' );
var path = require('path');
exports = module.exports = bunyan.createLogger({
	name: 'hpwc-workflow',
	streams: [{
			name: 'stdout-log',
			level: 'error',
			stream: process.stdout
		}, {
			name: 'mainlog',
			level: 'info',
			type: 'rotating-file',
			path: 'logs/hpc-workflow.log',
			period: '1w',   // week rotation
			count: 4        // keep 4 back copies
		}]
});

// Set the log level
exports.validLevels = [
		'fatal',
		'error',
		'warn',
		'info',
		'debug',
		'trace'
	];

exports.write = function( level, username, message ) {



	console.log(path.basename(__filename));
	//console.log(arguments.callee.toString());


	if ( exports.validLevels.indexOf( level ) < 0 ) {
		message = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
	}

	if ( username === "" ) {
		exports[ level ]( message );
	} else {
		exports[ level ]( { user: username }, message );
	}
};

/*exports.write = function() {

	var level = arguments[0],
		username = arguments[1],
		params = Array.prototype.slice.apply( arguments );

	//remove first element
	params.shift();

	//add username to the log
	params[0] = { user: username };

	if ( exports.validLevels.indexOf( level ) < 0 ) {
		params[1] = 'level ' + level + ' not exist! can\'t log your message!!!' ;
		level = 'error';
		params = [ params[0], params[1] ];
	}

	if ( username === "" ) {
		params.shift();
	}
	exports[ level ].apply( this, params );
};*/

exports.formattedWrite = function() {

	var level = arguments[0],
		username = arguments[1],
		params = Array.prototype.slice.apply( arguments );

	//remove first element
	params.shift();

	//add username to the log
	params[0] = { user: username };

	if ( exports.validLevels.indexOf( level ) < 0 ) {
		params[1] = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
		params = [ params[0], params[1] ];
	}

	if ( username === "" ) {
		params.shift();
	}
	exports[ level ].apply( this, params );
};