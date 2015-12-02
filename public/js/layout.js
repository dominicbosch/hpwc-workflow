"use strict";

var waitLog = false, msgList = {},
	socket, count = 0;
	
// Fetch the latest state of the configurations and store it in the public object
function getAllConfigurations( cb ) {
	$.get( '/services/configuration/getAll', function( data ) {
		oPub.configurations = data.configurations;
		oPub.openConnections = data.openConnections;
		if ( typeof(cb) === 'function' ) 
			cb( null, data );
	})
	.fail( function( xhr ) {
		if ( typeof(cb) === 'function' ) 
			cb({ code: 0, message: xhr.responseText });
	});
};

function selectFirstOption( idSelect ) {
	var selectBox = $( idSelect ),
		firstOption = $( 'option:first-child', selectBox );

	if ( firstOption.length > 0 ) {
		firstOption.attr( 'selected', true );
		selectBox.change();
	}
}

function toggleSelectedConnection( el ) {
	var button = $( el ),
		config = $( '#configs' ).val();

	if ( config === '' ) {
		alert( 'Choose a Configuration first!' );
		return;
	}

	//clean response area
	setTextAndScroll( 'resp_textarea', '' );

	//button.prop( 'disabled', true ); //done by default
	if ( button.text() === 'Connect' ) {
		toggleConnection( true, config, function( err ) {
			if ( err ) {
				alert( err.message );
			} else {
				button.text( 'Disconnect' );
				//activate action related to an extablished connection
				$( '.action[name=config]' ).prop( 'disabled', false );
			}
			button.removeAttr( 'disabled' );
		});
	} else {
		toggleConnection( false, config, function( err ) {
			if ( err ) {
				alert( err.message );
			} else {
				button.text( 'Connect' );
				//de-activate action related to an extablished connection
				//$( '.action[name=config]' ).prop( 'disabled', true );
				//clean wait image
				$( '#respWait' ).removeAttr( 'src' );
				$( '.kill' ).prop( 'disabled', true );
				$( '.action' ).prop( 'disabled', true ); //should be faster
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
		if ( oPub.updateMethodInstalled ) {
			getInstalledMethod( doConnect ? config : '' );
		}
		if ( typeof(cb) === 'function' ) 
			cb();
	})
	.fail( function( xhr ) {
		cb({ code: 0, message: xhr.responseText });
	});
}

//called when the selected connection changes
function updateConfigurationForm( cb ) {
	var config_name = $( '#configs' ).val(),
		button = $( '#connectButton' );

	$( '#configs' ).prop( 'disabled', true );
	button.attr( 'disabled', true );

/*	if ( oPub.updateProject ) {
		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );
		//de-activate action related to a project
		$( '.action[name=project]' ).prop( 'disabled', true );
	}*/
	
	if ( config_name === '' ) {

		//button.attr( 'disabled', true );

		//remove the connection from the session
		$.get('/services/session/cleanConnection', function( data ) {
			oPub.selectedConn.name = '';
			$( '#conf_table td' ).text( '--' );
			$( '#configs' ).prop( 'disabled', false );
			if ( oPub.updateProject ) {
				//clean project list
				$( '#projects' ).html( '<option value="">Choose A Project</option>' );
			}
			//de-activate action related to an extablished connection
			//$( '.action[name=config]' ).prop( 'disabled', true );
			$( '.action' ).prop( 'disabled', true );
			if ( typeof(cb) === 'function' ) 
				cb( '' );
		});

	} else {
		//fill configuration form
		$.get( '/services/configuration/get/' 
			+ config_name, function( data ) {

			if ( data.configuration ) {
				oPub.selectedConn.name = config_name;
				setConnectionForm( data.configuration );
				button.text( data.status ? 'Disconnect' : 'Connect' );
				//change action related to the connection
				//$( '.action[name=config]' ).prop( 'disabled', !data.status );
				if ( data.status ) {
					$( '.action[name=config]' ).prop( 'disabled', false );
				} else {
					$( '.action' ).prop( 'disabled', true );
				}
				
				if ( oPub.updateProject ) {
					getAndSetProjects( data.status ? data.configuration.name : '' );
					/*if ( typeof(cb) === 'function' ) 
						cb( data.status ? data.configuration.name : '' );*/
				}

				if ( typeof(cb) === 'function' ) 
					cb( data.status ? data.configuration.name : '' );

				button.removeAttr( 'disabled' );
			} else {
				alert ("Configuration not found");
			}
			$( '#configs' ).prop( 'disabled', false );
		});
	}
}

function updateConfigurationsList( cb, cb2, cb3 ) {

	var tempConfigsHTMLObj = $( '<select>' );
	tempConfigsHTMLObj.html( $( '<option>' ).attr( 'value', '' ).text( 'Choose A Configuration' ) );

	//$( '#configs' ).html( '<option value="">Choose A Configuration</option>' );

	$( '#configs' ).prop( 'disabled', true );
	$( '#connectButton' ).attr( 'disabled', true );

	//Get the possible configuration and check for the current configuration reading the project
	getAllConfigurations( function( err, data ) {
		if ( err ) {
			$( '#configs' ).html( tempConfigsHTMLObj.html() );
			alert( err.message );
		} else if ( data.configurations ) {
			//put data inside "configs" element
			/*for ( var config in data.configurations ) {
				$( '#configs' ).append( $( '<option>' ).attr( 'value', config ).text( config ) );
			}*/
			//put data inside "temporary" HTMLObj
			for ( var config in data.configurations ) {
				tempConfigsHTMLObj.append( $( '<option>' ).attr( 'value', config ).text( config ) );
			}

			$( '#configs' ).html( tempConfigsHTMLObj.html() );
			//Current configuration not empty
			if ( oPub.selectedConn.name && ( oPub.selectedConn.name !== '' ) ) {

			/*//set current configuration, change event is not raised because the configuration details are read from the session
				//reloadconfiguration if was selected
				$.get( '/services/configuration/get/' 
					+ oPub.selectedConn.name
				).done( function( data ) {
					if ( data.configuration ) {
						setConnectionForm( data.configuration );
						$( '#configs' ).val( oPub.selectedConn.name );

						$( '#connectButton' ).text( oPub.selectedConn.status ? 'Disconnect' : 'Connect' );
				
						//change action related to the connection
						$( '.action[name=config]' ).prop( 'disabled', !oPub.selectedConn.status );
						if ( ( oPub.selectedConn.status ) && ( oPub.updateProject ) ) {
							//retrieve project list if old connection is set and connected
							var config_name = oPub.selectedConn.name, 
								project_name = oPub.selectedConn.projectName;

							getAndSetProjects( config_name, project_name, cb2 );

							if ( typeof(cb) === 'function' ) 
								cb();
						}
						$( '#connectButton' ).removeAttr( 'disabled' );
					};
				}).fail( function( xhr ) {
					setTextAndScroll( 'info_textarea', xhr.responseText );
					$( '#conf_table td' ).text( '--' );
					$( '#configs' ).val( '' );
				});*/

				//set current configuration, change event is not raised because the configuration details are read from the session
				$( '#configs' ).val( oPub.selectedConn.name );
				$( '#connectButton' ).text( oPub.selectedConn.status ? 'Disconnect' : 'Connect' );
				//change action related to the connection
				$( '.action[name=config]' ).prop( 'disabled', !oPub.selectedConn.status );
				if ( ( oPub.selectedConn.status ) && ( oPub.updateProject ) ) {
					//retrieve project list if old connection is set and connected
					var config_name = oPub.selectedConn.name, 
						project_name = oPub.selectedConn.projectName;

					getAndSetProjects( config_name, project_name, cb2 );

					if ( typeof(cb) === 'function' ) 
						cb();
				}
				$( '#connectButton' ).removeAttr( 'disabled' );
			}
		}
		$( '#configs' ).prop( 'disabled', false );

		if ( typeof(cb3) === 'function' ) 
			cb3();
	});
}

function getAndSetProjects( config_name, project_name, cb ) {

	var tempProjectsHTMLObj = $( '<select>' );
	tempProjectsHTMLObj.html( $( '<option>' ).attr( 'value', '' ).text( 'Choose A Project' ) );

	if( config_name !== '' ) {

		var projectToSelect = '';
		$( '#projects' ).prop( 'disabled', true );
		
		//read the projects for an open connection and set the values
		$.get( '/services/project/getAll/' 
			+ config_name, function( projects ) {

			/*for ( var i in projects ) {
				$( '#projects' ).append($( '<option>' ).attr( 'value', projects[i] ).text( projects[i] ) );
			}*/

			for ( var i in projects ) {
				tempProjectsHTMLObj.append($( '<option>' ).attr( 'value', projects[i] ).text( projects[i] ) );
			}
			
		/*	for ( var i in projects ) {
				tempProjectsHTMLObj.append( $( '<option>' )
											.attr( 'value', projects[i] )
											.attr( 'selected', project_name ? true : false )
											.text( projects[i] ) 
				);
			}*/

			if ( project_name ) {
				//$( '#projects' ).val( project_name );
				projectToSelect = project_name;
				//activate action related to a project
				$( '.action[name=project]' ).prop( 'disabled', false );
				
			} else {
				//de-activate action related to a project
				$( '.action[name=project]' ).prop( 'disabled', true );
			}
		}).fail(function( xhr ) {
			setTextAndScroll( 'info_textarea', xhr.responseText );
			console.log( xhr.responseText );
		}).always(function() {
			$( '#projects' ).html( tempProjectsHTMLObj.html() );
			$( '#projects' ).val( projectToSelect );
			if ( typeof(cb) === 'function' ) 
					cb();
			$( '#projects' ).prop( 'disabled', false );
		});
	} else {
		//clean project list
		$( '#projects' ).html( tempProjectsHTMLObj.html() );
		//de-activate action related to a project
		$( '.action[name=project]' ).prop( 'disabled', true );
	}
}

function getInstalledMethod( config_name, cb ) {

	var tempMethodsInstHTMLObj = $( '<select>' );
	tempMethodsInstHTMLObj.html( $( '<option>' ).attr( 'value', '' ).text( 'Choose A Method Type' ) );

	if( config_name !== '' ) {

		$( '#method_types' ).prop( 'disabled', true );
		
		$.get('/services/method/getInstalled/'
			+ config_name, function( methods ) {

			for ( var i in methods ) {
				tempMethodsInstHTMLObj.append($( '<option>' ).attr( 'value', methods[i] ).text( methods[i] ) );
			}
			
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		}).always(function() {
			$( '#method_types' ).html( tempMethodsInstHTMLObj.html() );
			$( '#method_types' ).prop( 'disabled', false );
		});
		if ( typeof(cb) === 'function' ) 
			cb( config_name );
	} else {
		//clean method types list
		$( '#method_types' ).html( tempMethodsInstHTMLObj.html() );
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

	socket = io.connect( port + '/' + sockeID );

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
				$( '.action[name=project]' ).prop( 'disabled', false );
				$( '.kill' ).prop( 'disabled', true );
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

function killProcess( config_name, project_name ) {

	if( config_name !== '' && project_name !== '') {

		$.get('/services/project/kill/'
			+ config_name + '/'
			+ project_name, function( resp ) {

			resp = resp.trim();
			if ( resp == 'process killed' ) {
				addTextAndScroll( 'resp_textarea', '\nProcess killed!\n' );
				addTextAndScroll( 'info_textarea', '\nProcess killed!\n' );
			} else {
				addTextAndScroll( 'info_textarea', 'Cannot kill the process: ' + resp );
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	}
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
				$( '.action[name=project]' ).prop( 'disabled', false );
				$( '.kill' ).prop( 'disabled', true );
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

$(document).ready( function() {
	/*
	when configuration changes, the project selected is cleaned
	so we clean all the information related to the project
	directly here everytime configs changes
	*/
	$( '#configs' ).change( function() {

		//clean wait image
		$( '#respWait' ).removeAttr( 'src' );
		$( '.kill' ).prop( 'disabled', true );
		//clean response area
		setTextAndScroll( 'resp_textarea', '' );
	});
});