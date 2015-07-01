exports = module.exports = function( callerName ) {

	var logger = {};

	if ( global.config.production )
		logger = require( './' + global.config.logger.name )( global.config.logger.args ? callerName : '');
	else {
		logger = require( './bunyanLoggerWithErrorStack' );
	//	var logger = require( './bunyanLoggerWithErrorStack' ); //ok
	//	var logger = require( './bunyanLogger' )(callerName); //ok
	//	var logger = require( './winstonLoggerManualCopy' )(callerName); //ok
	//	var logger = require( './bunyanLoggerManualCopy' )(callerName); //ok
	}
	
	return logger;
};