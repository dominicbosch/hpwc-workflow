"use strict";

function toggleSelectedConnection( el ) {
	var button = $( el ),
		config = $( '#configs' ).val();

	if( config === '' ) {
		alert( 'Choose a Configuration first!' );
		return;
	}

	button.prop( 'disabled', true );
	if( button.text() === 'Connect' ) {
		toggleConnection( true, config, function( err ) {
			button.text( 'Disconnect' );
			button.removeAttr( 'disabled' );
		});
	} else {
		toggleConnection( false, config, function( err ) {
			button.text( 'Connect' );
			button.removeAttr( 'disabled' );
		});
	}
}

function toggleConnection( doConnect, config, cb ) {
	var strAction = doConnect ? 'connect' : 'disconnect';

	$.get('/services/configuration/' + strAction + '/' + config, function( data ) {
		getAndSetProjects( doConnect ? config : '' );
		if( typeof(cb) === 'function' ) cb();
	})
	.fail( function( req ) {
		// if( req.status === 409 ) {
		// 	setInfo( 'User already existing!', true );
		// } else {
		// 	setInfo( req.statusText, true );
		// }
	});
}

function updateConfigurationForm( cb ) {
	var config_name = $( '#configs' ).val(),
		button = $( '#connectButton' );

	if ( config_name === '' ) {

		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );

		button.attr( 'disabled', true );

		//remove the connection from the session
		$.get('/services/session/cleanConnection', function( data ) {
			$( '#conf_table td' ).text( '--' );
		});

	} else {
		//fill configuration form
		$.get( '/services/configuration/get/' + config_name, function( data ) {

			if ( data.configuration ) {
				setConnectionForm( data.configuration );
				button.text( data.status ? 'Disconnect' : 'Connect' );
				getAndSetProjects( data.status ? data.configuration.name : '' );
				button.removeAttr( 'disabled' );
				if( typeof(cb) === 'function' ) cb();
			} else {
				alert ("Configuration not found");
			}
		});
	}
}

function setConnectionForm( config ) {
	$( '#conf_table td[name="hostname"]' ).text( config.name );
	$( '#conf_table td[name="host"]' ).text( config.url );
	$( '#conf_table td[name="username"]' ).text( config.username );
	$( '#conf_table td[name="workflow"]' ).text( config.workhome );
	$( '#conf_table td[name="workspace"]' ).text( config.workspace );
}

$(document).ready(function() {
	$( '#configs' ).change( updateConfigurationForm );
});
