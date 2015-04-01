"use strict";

var waitLog = false, msgList = {},
	socket, count = 0;
	
// Fetch the latest state of the configurations and store it in the public object
function getAllConfigurations( cb ) {
	$.get( '/services/configuration/getAll', function( data ) {
		oPub.configurations = data.configurations;
		oPub.openConnections = data.openConnections;
		if( typeof(cb) === 'function' ) cb( null, data );
	})
	.fail( function( xhr ) {
		if( typeof(cb) === 'function' ) cb({ code: 0, message: xhr.responseText });
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
		cb({ code: 0, message: xhr.responseText });
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
			oPub.selectedConn.name = '';
			$( '#conf_table td' ).text( '--' );
		});

	} else {
		//fill configuration form
		$.get( '/services/configuration/get/' 
			+ config_name, function( data ) {

			if ( data.configuration ) {
				oPub.selectedConn.name = config_name;
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
		if ( err ) alert( err.message );
		else if ( data.configurations ) {
			//put data inside "configs" element
			for ( var config in data.configurations ) {
				$( '#configs' ).append( $( '<option>' ).attr( 'value', config ).text( config ) );
			}

			//Current configuration not empty
			if( oPub.selectedConn.name !== '' ) {

				//set current configuration, change event is not raised because the configuration details are read from the session
				$( '#configs' ).val( oPub.selectedConn.name );

				$( '#connectButton' ).text( oPub.selectedConn.status ? 'Disconnect' : 'Connect' );

				if ( ( oPub.selectedConn.status ) && ( oPub.updateProject ) ) {
					//retrieve project list if old connection is set and connected
					var config_name = oPub.selectedConn.name, 
						project_name = oPub.selectedConn.projectName;

					getAndSetProjects( config_name, project_name, cb2 );

					if ( typeof(cb) === 'function' ) 
						cb();
				}
			}
		}
	});
}

function getAndSetProjects( config_name, project_name, cb ) {

	if( config_name !== '' ) {
		//read the projects for an open connection and set the values
		$.get( '/services/project/getAll/' + config_name, function( projects ) {

			for ( var i in projects ) {
				$( '#projects' ).append($( '<option>' ).attr( 'value', projects[i] ).text( projects[i] ) );
			}

			if ( project_name ) {
				$( '#projects' ).val( project_name );
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

function createListItem( item, isChecked, isDisabled ) {
	return '<label>'
			+ '<input type="checkbox" value="' 
				+ item + '" ' 
				+ (isChecked ? 'checked ' : '') 
				+ (isDisabled ? 'disabled ' : '') 
			+ '>' 
			+ item 
		+ '</label>';
};

function addTextAndScroll( id, text ) {
	var obj = $( '#' + id );
	var txt = document.createTextNode( text );
	obj.append( txt ).prop( 'scrollTop', function () {
		return $( this ).prop( 'scrollHeight' );
	});
}

function setTextAndScroll( id, text ) {
	var obj = $( '#' + id );
	var txt = document.createTextNode( text );
	obj.empty().append( txt ).prop( 'scrollTop', function () {
		return $( this ).prop( 'scrollHeight' );
	});
}

function connectToSocket( sockeID ) {

	var port = (location.port === '') ? '' : ':' + location.port;

	socket = io.connect( port + '/' + sockeID, { secure : true } );

	console.log( socket, 'connectionTo ' + port );

	socket.on( 'connect', function () {
		console.log( 'Connected to socket' );
	});

	socket.on( 'data', function( data ) {
		//console.log( 'Received MSG ' + data.msg + ' from Server' );

		/*
			check if the information received is the one of the selected project
			in this case, show it in the textarea
		*/
		if ( data.project == $( '#projects' ).val() ) {
			if ( !waitLog ) {

				//The message received is the one we were waiting for
				if ( data.count === ( count + 1 ) ) {
					count++;
					//console.log( 'ADD TEXT NOW! ' + data.msg + ' COUNT: ' + count );
					addTextAndScroll( 'resp_textarea', data.msg );

				//We received a message but not the previous
				} else if ( data.count > count ) {
					//ask again for the log
					getLogSocketIO( oPub.selectedConn.name, data.project );
				} else {
					//console.log( 'msg skipped: ' + data.msg );
				}
			} else {
				//console.log( 'add msg: ' + data.msg + ' to list!');
				msgList[ data.count ] = data.msg;
			}
		}
	});

	socket.on( 'endData', function( data ) {
		//console.log( 'Received End MSG ' + data.project + ' from Server' );
		/*
			check if the information received is the one of the selected project
			in this case, show it in the textarea
		*/
		if ( data.project == $( '#projects' ).val() ) {
			//last msg already received
			if ( data.count === count ) {
				//unsubscribe
				unsubscribe( '' );
				count = 0;
	
				//to change also in layout.html and method.js
				if ( oPub.updateFolder ) {
					updateFileList( $( '#folders' ).val() );
				}

				//clean wait image
				$( '#respWait' ).removeAttr( 'src' );
	
				$( '.action' ).prop( 'disabled', false );
			} else {
				//ask again for the log
				getLogSocketIO( oPub.selectedConn.name, data.project );
			}
		}
	});

	socket.on( 'disconnect', function () {
		console.log( 'DAMMIT! Status: ' + socket.connected);
		socket.disconnect();
	});
}

function getLogSocketIO( config_name, project_name ) {

	if( config_name !== '' && project_name !== '') {

		//clean msgList
		msgList = {};
		
		waitLog = true;

		subscribe( config_name );

		$.get('/services/project/getLog/' 
			+ config_name + '/'
			+ project_name, function( log ) {

			setTextAndScroll( 'resp_textarea', log.content );
			//addTextAndScroll( 'resp_textarea', log.content );

			if ( log.active ) {
				//read from list and update log if necessary
				count = log.count;
				console.log( 'still active' );
				while ( msgList[ count + 1 ] ) {
					count++;
					addTextAndScroll( 'resp_textarea', msgList[ count ] );
				}
				/*
					No more ordered message in msgList.
					From now on we let the socket process the future messages
				*/
			} else { 
				/*
					Command not active anymore,
					full log already written!
				*/

				//unsubscribe
				unsubscribe( '' );
				count = 0;

				//clean wait image
				$( '#respWait' ).removeAttr( 'src' );

				$( '.action' ).prop( 'disabled', false );
			}

			waitLog = false;

		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	}
}

function subscribe( room ) {

	socket.emit( 'subscribe', { room : room });
}

function change( room ) {

	socket.emit( 'change', { room : room });
}

function unsubscribe( room ) {

	socket.emit( 'unsubscribe', { room : room });

}
