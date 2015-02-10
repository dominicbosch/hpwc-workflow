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

var fillSelectBox = function() {
	var selBox = $( 'select', $( '#tab2' ) ).html( '<option>Choose Configuration</option>' );

	$.get( '/services/configuration/getAll', function( oConfs ) {
		oPub.configurations = oConfs;
		for( var el in oConfs ) selBox.append( $( '<option>' ).text( el ) );
	});
};

var saveConfiguration = function() {

};

var deleteConfiguration = function() {

};

$(document).ready(function() {
	fillSelectBox();
	// We also update the select box on every tab click on this page:
	$( '.tab-links a' ).click( function() {
		fillSelectBox();
	});
	$( '.tab-content select' ).change(function() {
		var oConfs = oPub.configurations[ $(this).val() ];
		for( var el in oConfs ) {
			$( '#tab2 input[name="' + el + '"]' ).val( oConfs[ el ] );
		}
	});
});