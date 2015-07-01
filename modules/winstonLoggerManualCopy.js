var winston = require('winston')
	, path = require( 'path' )
	, util = require( 'util' )
	, validLevels = Object.keys(winston.config.syslog.levels)
	, write
	, formattedWrite
//	, winston.emitErrs = true
	;

var transportOptionsDailyRotateFile = {
	name: 'mainlog'
	, level: 'info'
	, filename: __dirname + '/../logs/hpc-workflow.log'
	, handleExceptions: true
//	, json: true
	, datePattern: '.yyyy-MM-dd'
//	, maxsize: 5242880 //5MB
//	, maxFiles: 5
	, colorize: true
};

var logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			name: 'console'
			, level: 'error'
			, handleExceptions: true
			, colorize: true
		}),
		new winston.transports.DailyRotateFile(transportOptionsDailyRotateFile)
	]
});

logger.write = function( level, username, message ) {

	if ( validLevels.indexOf( level ) < 0 ) {
		message = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
	}

	if ( username === "" ) {
		//logger.log( level, message );
		logger[ level ]( message, { label: this.filename } );
	} else {
		//logger.log( level , message, { pid: process.pid, user: username } );
		logger[ level ]( message, { pid: process.pid, label: this.filename, user: username } );
	}

};

logger.formattedWrite = function() {

	var level = arguments[0],
		username = arguments[1],
		metadata = { pid: process.pid, label: this.filename },
		params = Array.prototype.slice.apply( arguments );

	//remove first 2 element
	params.shift();
	params.shift();

	if ( validLevels.indexOf( level ) < 0 ) {
		params[0] = 'LEVEL ' + level + ' DOES NOT ESISTS! YOUR MESSAGE CAN\'T BE LOGGED!!!';
		level = 'error';
		params = [ params[0] ];
	}

	if ( username !== "" ) {
		//add username to metadata object
		metadata.user = username;
	}

	params.push( metadata );

	logger[ level ].apply( this, params );
};

logger.setLevel = function( name, level ) {

	logger.transports[ name ].level = level;

};

logger.getLevel = function( name ) {

	return logger.transports[ name ].level;

};

exports = module.exports = function(callerName) {

	var moduleLogger = {};

	moduleLogger.write = logger.write;

	moduleLogger.formattedWrite = logger.formattedWrite;

	moduleLogger.getLevel = logger.getLevel;

	moduleLogger.setLevel = logger.setLevel;

	moduleLogger.validLevels = validLevels;

	moduleLogger.filename = path.basename(callerName);

	return moduleLogger;

};