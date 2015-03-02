
var io, userChannels = {},
	socketio = require( 'socket.io' );

var ping = function(sock) {
	return function () {
		sock.emit( 'news', { hello: 'ping' } );
		setTimeout( ping(sock), 2000 );
	};
};

exports.listen = function( server ) {
	io = socketio.listen( server );
	console.log('socketio starting to listen...');
	io.on('connection', function (socket) {
		console.log('socketio has new connection...');
		socket.emit( 'news', { hello: 'world' } );
		ping(socket)();
		socket.on( 'my other event', function( data ) {
			console.log( 'oEvent: ', data );
		});
	});
};

exports.openUserChannel = function( username ) {
	if( userChannels[ username ] ) {
		console.log( 'User Channel already open for user "' + username + '"!' );
		return;
	}
	userChannels[ username ] = io.of( '/' + username )
		.on( 'connection', function ( socket ) {
			console.log('socketio has new connection on channel for user ' + username );
		});
};

exports.closeUserChannel = function( username ) {
	if( userChannels[ username ] ) {
		userChannels[ username ].disconnect( 'boom!' );
		delete userChannels[ username ];
	}
};

exports.sendConsole = function( username, console, info ) {
	userChannels[ username ].emit( console, info );
}