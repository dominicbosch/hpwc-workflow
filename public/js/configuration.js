var fetchInputValues = function( arr ) {
	var obj = {};
	for( var i = 0; i < arr.length; i++) {
		obj[ arr[ i ] ] = $( 'input[name=' + arr[ i ] + ']' ).val();
	}
	return obj;
};

var setInfo = function( text, fail ) {
	$( '#info' )
		.addClass( fail ? 'wrong' : 'right' )
		.removeClass( fail ? 'right' : 'wrong' )
		.text( text );
};

var initConfiguration = function() {
	var oValues, isValid = true,
		arrInputs = [
			'name',
			'url',
			'port',
			'username',
			'password',
			'workspace',
			'workhome'
		];

	setInfo( '' );
	oValues = fetchInputValues( arrInputs );
	for( var el in oValues ) {
		if( oValues[ el ] === '' ) isValid = false;
	}
	if( !isValid ) {
		alert( 'You need to fill all input fields!' );
	} else {
		$.post( '/services/configuration/create', oValues, function( answ ) {
			setInfo( answ );
			
			updateConfigurationForm();
		})
		.fail( function( xhr ) {
			setInfo( xhr.responseText, true );
		});
	}
};

var fillSelectBox = function( tab ) {
	var selBox = $( 'select', tab );
	// $( '*', selBox ).remove();

	$.get( '/services/configuration/getAll', function( oConfs ) {
		console.log( oConfs );

		for( var el in oConfs ) {
			selBox.append( $( '<option>' ).text( el ) );
		// console.log( el, $( 'input [name="' + el + '"]', tab ) );
		// 	$( 'input [name="' + el + '"]', tab ).val( oConfs[ el ] );
		}
	});
};

var saveConfiguration = function() {

};

var deleteConfiguration = function() {

};

$(document).ready(function() {
	$( '.tab-links a' ).click( function() {
		var id = $( this ).attr( 'href' ),
			activeTab = $( id );
		
		fillSelectBox( activeTab );

		if( id === '#tab2' ) {

		} else if( id == '#tab3' ) {

		}

	});
});