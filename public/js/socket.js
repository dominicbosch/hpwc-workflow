var socket = io.connect( ':443' );
console.log(socket, 'connectionto :443');
	socket.on( 'news', function ( data ) {
	console.log( 'news: ', data );
	socket.emit( 'my other event', { my: 'data' } );
});