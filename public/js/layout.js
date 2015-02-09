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
			button.removeProp( 'disabled' );
		});
	} else {
		button.text( 'Connect' );
		toggleConnection( false, config, function( err ) {
			button.removeProp( 'disabled' );
		});
	}
}

function toggleConnection( action, config, cb ) {
	var strAction = connect ? 'connect' : 'disconnect';

	$.get('/services/configuration/' + strAction + '/' + config, function( data ) {
		getAndSetProjects( action, config );
		if( cb ) cb();
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
	var config_name = $( '#configs' ).val();
	var button = $( '#connectButton' );

	//clean project list
	$( '#projects' ).html( '<option value="">Choose A Project</option>' );

	if (config_name === "") {
		button.prop( 'disabled', true );

		//remove the connection from the session
		$.get('/services/session/cleanConnection', function( data ) {
			cleanConnectionForm();
		});

	} else {
		//fill configuration form
		$.get( '/services/configuration/get/' + config_name, function( data ) {

			if ( data.configuration ) {
				setConnectionForm( data.configuration );
				button.text( data.status ? 'Disconnect' : 'Connect' );
				if( data.status ) {
					getAndSetProjects( data.configuration.name );
				}
				button.removeProp( 'disabled' );
				if( cb ) cb();
			} else {
				alert ("Configuration not found");
			}
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