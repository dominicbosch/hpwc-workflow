var bunyan = require( 'bunyan' )
	, path = require('path')
	, util = require( 'util' )
	, logger = bunyan.createLogger({
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
	})
	;


function ModuleLogger( options, filename ) {
    this.logger = options.logger.child({ label: filename } );
    //this.logger.info('creating a wuzzle')
}

// Set the log level
ModuleLogger.prototype.validLevels = [
		'fatal',
		'error',
		'warn',
		'info',
		'debug',
		'trace'
	];

ModuleLogger.prototype.write = function( level, username, message ) {

	if ( this.validLevels.indexOf( level ) < 0 ) {
		message = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
	}

	if ( username === "" ) {
		this.logger[ level ]( message );
	} else {
		this.logger[ level ]( { user: username }, message );
	}
};

ModuleLogger.prototype.formattedWrite = function() {

	var level = arguments[0],
		username = arguments[1],
		params = Array.prototype.slice.apply( arguments );


	//remove first element
	params.shift();

	//metadata as first parameter
	params[0] = { user: username };

	if ( this.validLevels.indexOf( level ) < 0 ) {
		params[1] = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
		params = [ params[0], params[1] ];
	}

	if ( username === "" ) {
		params.shift();
	}

	this.logger[ level ].apply( this.logger, params );
};

ModuleLogger.prototype.setLevel = function( name, level ) {

	return logger.levels( name, level );

};

ModuleLogger.prototype.getLevel = function( name ) {

	return logger.levels( name );

};

exports = module.exports = function(callerName) {

	return new ModuleLogger( { logger: logger }, path.basename( callerName ) );

};
