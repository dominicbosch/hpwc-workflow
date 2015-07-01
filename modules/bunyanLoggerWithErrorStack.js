var bunyan = require( 'bunyan' )
	, path = require('path')
	, util = require( 'util' )
	;

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
			path: __dirname + '/../logs/hpc-workflow.log',
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

  /**
  * examines the call stack and returns a string indicating 
  * the file and line number of the n'th previous ancestor call.
  * this works in chrome, and should work in nodejs as well.  
  *
  * @param n : int (default: n=1) - the number of calls to trace up the
  *   stack from the current call.  `n=0` gives you your current file/line.
  *  `n=1` gives the file/line that called you.
  */
function traceCaller(n) {
	if ( isNaN(n) || n<0) 
		n = 1;
	n += 1;
	var s = ( new Error() ).stack
		, a = s.indexOf( '\n', 5 );
	while ( n-- ) {
		a = s.indexOf( '\n', a+1 );
		if ( a<0 ) { 
			a = s.lastIndexOf( '\n', s.length ); 
			break;
		}
	}
	b = s.indexOf( '\n', a+1 ); 
	if ( b < 0 ) 
		b = s.length;
	a = Math.max( s.lastIndexOf( ' ', b ), s.lastIndexOf( '/', b ) );
	b = s.lastIndexOf( ':', b );
	s = s.substring( a+1, b );
	return s;
}

exports.write = function( level, username, message ) {

	var fileAndLine = traceCaller(1);

	if ( this.validLevels.indexOf( level ) < 0 ) {
		message = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
	}

	if ( username === "" ) {
		this[ level ]( { label: fileAndLine }, message );
	} else {
		this[ level ]( { label: fileAndLine, user: username }, message );
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

	var fileAndLine = traceCaller(1);

	//remove first element that is the level
	params.shift();

	//metadata as first parameter
	params[0] = { label: fileAndLine, user: username };

	if ( this.validLevels.indexOf( level ) < 0 ) {
		params[1] = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
		params = [ params[0], params[1] ];
	}

	if ( username === "" ) {
		delete params[0].user;
	}

	this[ level ].apply( this, params );
};

exports.setLevel = function( name, level ) {

	return this.levels( name, level );

};

exports.getLevel = function( name ) {

	return this.levels( name );

};