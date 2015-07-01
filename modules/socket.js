
var io
	, logger = require( './logger' )(module.filename)
	, util = require( 'util' )
	, socketio = require( 'socket.io' )
	;

exports.listen = function( server ) {
	io = socketio.listen( server );
	//logger.write( 'info' , '', 'socketio starting to listen...' );
	console.log( 'socket.js: ' + 'socketio starting to listen...' );
	io.on('connection', function (socket) {
	//io.sockets.on('connection', function (socket) {
		console.log( 'socket.js: ' + 'main socketio has new connection...' );
	});
	io.on( 'disconnect', function( data ) {
		console.log( 'socket.js: ' + 'main socketio disconnected...' );
	});
};

/*exports.listen = function( server, sessionMiddleware ) {
	io = socketio.listen( server );
	io.use( function( socket, next ) {
		sessionMiddleware( socket.request, socket.request.res, next );
	});
	console.log( 'socketio starting to listen...' );
	io.on( 'connection', function (socket) {

		
		console.log( 'socketio has new connection...' );
		var username = socket.request.session.username;
		userChannels[ username ][ socket.id ] = socket;
		console.log( 'User ' + socket.request.session.username + ' socket added to list' );

		socket.on('subscribe', function( data ) {
			socket.join( data.room );
		});
		socket.on('unsubscribe', function( data ) {
			socket.leave( data.room );
		});
		socket.on('disconnect', function( data ) {
			delete userChannels[ username ][ socket.id ];
			console.log( 'DISCONNECTED!!!!' );
		});
	});
};*/

exports.openSocket = function( socketID ) {

	//start to listen
	var nsp = io.of( '/' + socketID );

	nsp.on( 'connection', function ( socket ) {
		var room = null;
		console.log( 'socket.js: ' + 'Connection for user namespace: ' + socketID );
		socket.on( 'subscribe', function( data ) {
			socket.join( data.room );
			console.log( 'socket.js: ' + 'Subscribed to ' + data.room );
			room = data.room;
		});
		socket.on( 'change', function( data ) {
			if ( room )
				socket.leave( room );
			socket.join( data.room );
			room = data.room;
		});
		socket.on( 'unsubscribe', function( data ) {
			socket.leave( room );
			console.log( 'socket.js: ' + 'Unsubscribed from ' + room );
			room = null;
		});
		socket.on( 'disconnect', function( data ) {
			console.log( 'socket.js: ' + 'DISCONNECTED!!!!' );
		});
	});

};

exports.sendInRoom = function( socketID, room, msg ) {
	var nsp = io.of( '/' + socketID );
	nsp.in( room ).emit( msg.type, msg );
};
