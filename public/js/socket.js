
var port = (location.port === '') ? '' : ':' + location.port;
var socket = io.connect( port + '/' );
console.log(socket, 'connectionto ' + port);

socket.on( 'connect', function () {
	console.log( 'YAY: ');
});
socket.on( 'news', function ( data ) {
	console.log( 'news: ', data );
	socket.emit( 'my other event', { my: 'data' } );
});
socket.on( 'disconnect', function () {
	console.log( 'DAMMIT: ');
});