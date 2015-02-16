"use strict";

// Fetch the latest state of the configurations and store it in the public object
function getAllConfigurations( cb ) {
	$.get( '/services/configuration/getAll', function( data ) {
		oPub.configurations = data.configurations;
		oPub.openConnections = data.openConnections;
		if( typeof(cb) === 'function' ) cb( null, data );
	})
	.fail( function( xhr ) {
		if( typeof(cb) === 'function' ) cb( new Error( xhr.statusText ) );
	});
};

function selectFirstOption( idSelect ) {
	var selectBox = $( idSelect ),
		firstOption = $( 'option:first-child', selectBox );

	if( firstOption.length > 0 ) {
		firstOption.attr( 'selected', true );
		selectBox.change();
	}
}

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
			if( err ) {
				alert( err.message );
			} else {
				button.text( 'Disconnect' );
			}
			button.removeAttr( 'disabled' );
		});
	} else {
		toggleConnection( false, config, function( err ) {
			if( err ) {
				alert( err.message );
			} else {
				button.text( 'Connect' );
			}
			button.removeAttr( 'disabled' );
		});
	}
}

function toggleConnection( doConnect, config, cb ) {
	var strAction = doConnect ? 'connect' : 'disconnect';
	$.get('/services/configuration/' + strAction + '/' + config, function( data ) {
		if ( oPub.updateProject ) {
			getAndSetProjects( doConnect ? config : '' );
		}
		if( typeof(cb) === 'function' ) cb();
	})
	.fail( function( xhr ) {
		cb( new Error( xhr.responseText ) );
	});
}

function updateConfigurationForm( cb ) {
	var config_name = $( '#configs' ).val(),
		button = $( '#connectButton' );

	if ( oPub.updateProject ) {
		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );
	}
	
	if ( config_name === '' ) {

		button.attr( 'disabled', true );

		//remove the connection from the session
		$.get('/services/session/cleanConnection', function( data ) {
			$( '#conf_table td' ).text( '--' );
		});

	} else {
		//fill configuration form
		$.get( '/services/configuration/get/' 
			+ config_name, function( data ) {

			if ( data.configuration ) {
				setConnectionForm( data.configuration );
				button.text( data.status ? 'Disconnect' : 'Connect' );
				if ( oPub.updateProject ) {
					getAndSetProjects( data.status ? data.configuration.name : '' );
					if ( typeof(cb) === 'function' ) 
						cb( data.status ? data.configuration.name : '' );
				}
				button.removeAttr( 'disabled' );				
			} else {
				alert ("Configuration not found");
			}
		});
	}
}

function updateConfigurationsList( cb, cb2 ) {

	$( '#configs' ).html( '<option value="">Choose A Configuration</option>' );

	//Get the possible configuration and check for the current configuration reading the project
	getAllConfigurations(function( err, data ) {

		if ( data.configurations ) {
			//put data inside "configs" element
			for ( var config in data.configurations ) {
				$( '#configs' ).append($( '<option>' ).attr( 'value', config ).text( config ) );
			}

			//Current configuration not empty
			if( oPub.selectedConn.name !== '' ) {

				//set current configuration, change event is not raised because the configuration details are read from the session
				$( '#configs' ).val( oPub.selectedConn.name );

				$( '#connectButton' ).text( oPub.selectedConn.status ? 'Disconnect' : 'Connect' );

				if ( ( oPub.selectedConn.status ) && ( oPub.updateProject ) ) {
					//retrieve project list if old connection is set and connected
					var config_name = oPub.selectedConn.name, 
						project_val = oPub.selectedConn.projectName;

					getAndSetProjects( config_name, project_val, cb2 );

					if ( typeof(cb) === 'function' ) 
						cb();
				}
			}
		}
	});
}

function getAndSetProjects( config_name, project_val, cb ) {

	if( config_name !== '' ) {
		//read the projects for an open connection and set the values
		$.get( '/services/project/getAll/' + config_name, function( projects ) {

			for ( var i in projects ) {
				$( '#projects' ).append($( '<option>' ).attr( 'value', projects[i] ).text( projects[i] ) );
			}

			if (project_val) {
				$( '#projects' ).val( project_val );
				if ( typeof(cb) === 'function' ) 
					cb();
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	} else {
		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );
	}
}

function setConnectionForm( config ) {
	$( '#conf_table td[name="hostname"]' ).text( config.name );
	$( '#conf_table td[name="host"]' ).text( config.url );
	$( '#conf_table td[name="username"]' ).text( config.username );
	$( '#conf_table td[name="workflow"]' ).text( config.workhome );
	$( '#conf_table td[name="workspace"]' ).text( config.workspace );
}

function getURLQuery() {
	var query = window.location.search.substring(1),
		arrParams = query.split( '&' ),
		arrKeyVal, oQuery = {};

	for( var i = 0; i < arrParams.length; i++ ) {
		arrKeyVal = arrParams[ i ].split( '=' );
		if( arrKeyVal[ 0 ] !== '' ) {
			oQuery[ arrKeyVal[ 0 ] ] =  arrKeyVal[ 1 ];
		}
	}
	return oQuery;
}
