var fetchInputValues = function( parent, arr ) {
	var obj = {};
	for( var i = 0; i < arr.length; i++) {
		obj[ arr[ i ] ] = $( 'input[name=' + arr[ i ] + ']', parent ).val();
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
	$( '#tab1 button' ).prop( 'disabled', true );
	oValues = fetchInputValues( $( '#tab1' ), arrInputs );
	for( var el in oValues ) {
		if( oValues[ el ] === '' ) isValid = false;
	}
	if( !isValid ) {
		alert( 'You need to fill all input fields!' );
		$( '#tab1 button' ).prop( 'disabled', false );
	} else {
		$.post( '/services/configuration/create', oValues, function( answ ) {
			setInfo( answ );
			updateConfigurationsList();
			$( '#tab1 button' ).prop( 'disabled', false );
		})
		.fail( function( xhr ) {
			setInfo( xhr.responseText, true );
			$( '#tab1 button' ).prop( 'disabled', false );
		});
	}
};

var fillSelectBox = function() {
	var selBox = $( '#tab2 select' ).html( '<option value="">Choose Configuration</option>' );
	getAllConfigurations(function( err, data ) {
		if( !err ) for( var el in data.configurations ) selBox.append( $( '<option>' ).text( el ) );
	});
};

var saveConfiguration = function() {
	var oValues, isValid = true,
		arrInputs = [
			'name',
			'url',
			'port',
			'username',
			'workspace',
			'workhome'
		];
	$( '#tab2 button' ).prop( 'disabled', true );
	if( $( '#tab2 select' ).prop( 'selectedIndex' ) === 0 ) {
		alert( 'Select a configuration first!' );
		$( '#tab2 button' ).prop( 'disabled', false );
		return;
	}
	oValues = fetchInputValues( $( '#tab2' ), arrInputs );
	for( var el in oValues ) {
		if( oValues[ el ] === '' ) isValid = false;
	}
	if( !isValid ) {
		alert( 'You need to fill all input fields!' );
		$( '#tab2 button' ).prop( 'disabled', false );
	} else {
		var result = confirm( 'Do you really want to update this configuration?' );
		if( result ) {
			oValues.name = $( '#tab2 select' ).val();
			$.post( '/services/configuration/update', oValues, function( answ ) {
				setInfo( answ );
				updateConfigurationsList();
				$( '#tab2 button' ).prop( 'disabled', false );
			})
			.fail( function( xhr ) {
				setInfo( xhr.responseText, true );
				$( '#tab2 button' ).prop( 'disabled', false );
			});
		} else $( '#tab2 button' ).prop( 'disabled', false );
	}
};

var deleteConfiguration = function() {
	var result, options;
	$( '#tab2 button' ).prop( 'disabled', true );
	if( $( '#tab2 select' ).prop( 'selectedIndex' ) === 0 ) {
		alert( 'Select a configuration first!' );
		$( '#tab2 button' ).prop( 'disabled', false );
		return;
	}
	result = confirm( 'Do you really want to delete this configuration?' );
	if( result ) {
		options = {
			name: $( '#tab2 select' ).val()
		};
		$.post( '/services/configuration/delete', options, function( answ ) {
			setInfo( answ );
			updateConfigurationsList();
			fillSelectBox();
			$( '#tab2 button' ).prop( 'disabled', false );
			$( '#tab2 input' ).val( '' );
		})
		.fail( function( xhr ) {
			setInfo( xhr.responseText, true );
			$( '#tab2 button' ).prop( 'disabled', false );
		});
	} else $( '#tab2 button' ).prop( 'disabled', false );
};

$(document).ready( updateConfigurationsList );

$(document).ready(function() {
	$( '#configs' ).change( updateConfigurationForm );
});

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