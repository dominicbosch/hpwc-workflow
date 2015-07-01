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

// Set the log level
logger.validLevels = [
		'fatal',
		'error',
		'warn',
		'info',
		'debug',
		'trace'
	];

logger.write = function( level, username, message ) {

	if ( logger.validLevels.indexOf( level ) < 0 ) {
		message = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
	}

	if ( username === "" ) {
		logger[ level ]( { label: this.filename }, message );
	} else {
		logger[ level ]( { label: this.filename, user: username }, message );
	}
};

logger.formattedWrite = function() {

	var level = arguments[0],
		username = arguments[1],
		params = Array.prototype.slice.apply( arguments );

	//remove first element
	params.shift();

	//metadata as first parameter
	params[0] = { label: this.filename, user: username };

	if ( logger.validLevels.indexOf( level ) < 0 ) {
		params[1] = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
		params = [ params[0], params[1] ];
	}

	if ( username === "" ) {
		delete params[0].user;
	}
	logger[ level ].apply( logger, params );
};

logger.setLevel = function( name, level ) {

	return logger.levels( name, level );

};

logger.getLevel = function( name ) {

	return logger.levels( name );

};

exports = module.exports = function(callerName) {

	var moduleLogger = {};

	moduleLogger.write = logger.write;

	moduleLogger.formattedWrite = logger.formattedWrite;

	moduleLogger.getLevel = logger.getLevel;

	moduleLogger.setLevel = logger.setLevel;

	moduleLogger.validLevels = logger.validLevels;

	moduleLogger.filename = path.basename(callerName);

	return moduleLogger;

};
