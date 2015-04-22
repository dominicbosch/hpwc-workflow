var bunyan = require( 'bunyan' );

var exports = module.exports = bunyan.createLogger({ 
	name: 'hpwc-workflow',
	streams: [{
			level: 'error'
			stream: process.stdout
		}, {
			level: 'info'
			path: 'info.log'
		}]
});
