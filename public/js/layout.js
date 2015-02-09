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
		button.text( 'Disconnect' );
		toggleConnection( true, config, function( err ) {

			button.prop( 'disabled', false );
		});
	} else {
		button.text( 'Connect' );
		toggleConnection( false, config, function( err ) {

			button.prop( 'disabled', false );
		});
	}
}

function toggleConnection( action, config, cb ) {
	var action = connect ? 'connect' : 'disconnect';
		$.get('/services/configuration/' + action + '/' + config_name, function( data ) {
			getAndSetProjects( config_name );
		}).fail(function( xhr ) {
			alert( '' );
		});
	}
}

function connect( action, config, cb ) {

	var config_name = $('#configs').val();
	if ( config_name !== "" ) {
		$.get('/services/configuration/connect/' + config_name, function( data ) {
			$('#connButton').prop('hidden', true);
			$('#disconnectButton').prop('hidden', false);
			$('#connectButton').prop('hidden', false);
			getAndSetProjects( config_name );
		}).fail(function( xhr ) {
			alert( '' );
		});
	} else {
		alert("Choose a Configuration before connect");
	}
}

function disconnect( cb ) {

	var config_name = $('#configs').val();
	if ( config_name !== "" ) {
		$.get('/services/configuration/disconnect/' + config_name, function( data ) {
			$('#connButton').prop('hidden', false);
			$('#disconnectButton').prop('hidden', true);
			getAndSetProjects( "" );
		});
	} else {
		alert("Choose a Configuration before connect");
	}
}

function cleanConnectionForm() {
	$("#conf_table td[name='hostname']").html("--");
	$("#conf_table td[name='host']").html("--");
	$("#conf_table td[name='username']").html("--");
	$("#conf_table td[name='workflow']").html("--");
	$("#conf_table td[name='workspace']").html("--");
}

function setConnectionForm( config ) {
	$("#conf_table td[name='hostname']").html(config.name);
	$("#conf_table td[name='host']").html(config.url);
	$("#conf_table td[name='username']").html(config.username);
	$("#conf_table td[name='workflow']").html(config.workhome);
	$("#conf_table td[name='workspace']").html(config.workspace);
}