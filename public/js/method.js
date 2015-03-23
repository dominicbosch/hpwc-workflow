"use strict";

oPub.updateProject = true;
var getLogTimeout = null,
	waitLog = false, msgList = {},
	socket, count = 0;

function cleanMethodForm() {
	$( '#edit_method input[name="method_type"]' ).val( '' );
	$( '#src_files' ).empty();
	$( '#edit_method textarea[name="comment"]' ).val( '' );
}

function setMethodForm( method ) {
	$( '#edit_method input[name="method_type"]' ).val( method.type );
	var srcList = method.srcList;
	for ( var i in srcList ) {
		$( '#src_files' ).append($( '<option>' ).attr( 'value', srcList[i] ).text( srcList[i] ) );
	}
	$( '#edit_method textarea[name="comment"]' )
		.val( method.comment ).prop( 'scrollTop', function () {
			return $( this ).prop( 'scrollHeight' );
		});;

}

function updateMethodForm( cb ) {
	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();

	if (method_name === '') {
		cleanMethodForm();
	} else {
		$.get( '/services/method/get/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ method_name, function( method ) {
			setMethodForm( method );
		});
	}
}

function getAndSetMethods( config_name, project_name, method_val, cb ) {

	if( ( config_name !== '' ) && ( project_name !== '' ) ) {
		//read the projects for an open connection and set the values
		$.get( '/services/method/getAll/' 
			+ config_name + '/'
			+ project_name, function( methods ) {

			for ( var i in methods ) {
				$( '#methods' ).append($( '<option>' ).attr( 'value', methods[i] ).text( methods[i] ) );
			}

			if ( method_val ) {
				$( '#methods' ).val( method_val );
				updateMethodForm( );
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});

		if ( typeof(cb) === 'function' ) 
			cb( );

	} else {
		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );
	}
}

function getInstalledMethod( config_name, cb ) {

	//clean method list
	$( '#method_types' ).html( '<option value="">Choose A Method Type</option>' );

	if( config_name !== '' ) {
		
		$.get('/services/method/getInstalled/'
			+ config_name, function( methods ) {

			for ( var i in methods ) {
				$( '#method_types' ).append($( '<option>' ).attr( 'value', methods[i] ).text( methods[i] ) );
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});

		if ( typeof(cb) === 'function' ) 
			cb( config_name );
	}
}

function actionOnMethodSocketIO( action ) {

	var	config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();

	if ( config_name === '' ) {
		alert( 'Select A Configuration' );
		return;
	}

	if ( project_name === '' ) {
		alert( 'Select A Project' );
		return;
	}

	if ( method_name === '' ) {
		alert( 'Select A Method' );
		return;
	}

	$( '.action' ).prop( 'disabled', true );

	$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );

	subscribe( config_name );

	$.get('/services/method/' 
		+ action + '/'
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name, function( data ) {

		var msg = data;

		if ( data === true ) {
			msg = 'Command Fired!\nThe output will be shown in the respose area';
		} else {
			//unsubscribe
			unsubscribe( '' );
			count = 0;

			//clean wait image
			$( '#respWait' ).removeAttr( 'src' );

			$( '.action' ).prop( 'disabled', false );
		}

		addTextAndScroll( 'info_textarea', msg );

	}).fail(function( xhr ) {
		console.log( xhr.responseText );
	});
}

function getLogSocketIO( config_name, project_name ) {

	if( config_name !== '' && project_name !== '') {

		//clean msgList
		msgList = {};
		
		waitLog = true;

		subscribe( config_name );

		$.get('/services/method/getLog/' 
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

function manage_method( action ) {

	var id = '' ;
	var	method = {
			action: action
		};
	var	config_name = $( '#configs' ).val();
	var project_name = $( '#projects' ).val();

	if ( config_name === '' ) {
		alert( 'Select A Configuration' );
		return;
	}

	if ( project_name === '' ) {
		alert( 'Select A Project' );
		return;
	}

	if ( action === 'delete' ) {
		method.name = $( '#methods' ).val();
	} else {
		if ( action === 'create' ) {
			id = 'new_method' ;
			method.name = $( '#new_method input[name="method_name"]' ).val();
			method.type = $( '#method_types' ).val();
		} else if ( action === 'edit' ) {
			id = 'edit_method';
			method.name = $( '#methods' ).val();
			method.type = $( '#' + id + ' input[name="method_type"]' ).val();
		}

		method.comment = $( '#' + id + ' textarea[name="comment"]' ).val();
	}

	if ( ( method.name === '' ) || ( method.type === '' ) ) {
		alert('Module name and type are mandatory, choose both');
		return;
	}

	$.post( '/services/method/manage/'
		+ config_name + '/' 
		+ project_name, method, function( data ) {

		setTextAndScroll( 'resp_textarea', data );

		cleanMethodForm();

		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );

		var	method_val = method.name;

		if( method.action === 'delete' ) {
			method_val = null;
		} else if ( method.action === 'create' ) {
			//clean creation form
			$( '#new_method input[name="method_name"]' ).val( '' );
			$( '#method_types' ).val( '' );
			$( '#new_method textarea[name="comment"]' ).val( '' );
		}

		//update method list
		getAndSetMethods( config_name, project_name, method_val );
	});
}

$(document).ready(function() {

	var config_name = oPub.selectedConn.name, 
		project_name = oPub.selectedConn.projectName,
		socketID = oPub.socketID;

/*	updateConfigurationsList( 
		function() {
			getInstalledMethod( config_name );
		}, 
		function() {
			getAndSetMethods( config_name, project_name );
			$( '.action' ).prop( 'disabled', true );
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLog( config_name, project_name ); 
		}
	);*/

	connectToSocket( socketID );

	updateConfigurationsList( 
		function() {
			getInstalledMethod( config_name );
		}, 
		function() {
			getAndSetMethods( config_name, project_name );
			$( '.action' ).prop( 'disabled', true );
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLogSocketIO( config_name, project_name ); 
		}
	);

	$( '#connectButton' ).on( 'click', cleanMethodForm );

	$( '#configs' ).change( function() {

		var config_name = $( '#configs' ).val();

		//unsubscribe from previous
		unsubscribe( '' );

		$( '#respWait' ).removeAttr( 'src' );
		setTextAndScroll( 'resp_textarea', '' );
		
		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );

		cleanMethodForm();

		//clean method type
		$( '#method_types' ).html( '<option value="">Choose A Method Type</option>' );

		updateConfigurationForm( getInstalledMethod );

		/*updateConfigurationForm( 
			function( data ) {
				getInstalledMethod( data, subscribe ); //subscribe to new
			}
		);*/
	});

	//get method
	$("#methods").change( function() {
		//setTextAndScroll( 'resp_textarea', '' );
		updateMethodForm( );
	});

	//when the project selected change, we read the modules implemented
	$("#projects").change( function() {

		var config_name = $( '#configs' ).val(),
			project_name = $(this).val();

		if ( config_name === '' ) {
			alert( 'Select A Configuration' );
			return;
		}

		//unsubscribe
		unsubscribe( '' );
		count = 0;

		//clean wait image
		$( '#respWait' ).removeAttr( 'src' );

		$( '.action' ).prop( 'disabled', false );

		//clean response area
		setTextAndScroll( 'resp_textarea', '' );

		$( '#methods' ).html( '<option value="">Choose A Method</option>' );

		cleanMethodForm();

		if ( project_name === '' ) {
			$.get('/services/session/cleanProject', function( data ) {
				
			});
		} else {
			//fill project form
			$.get( '/services/project/get/' 
				+ config_name + '/' 
				+ project_name, function( project ) {
				
				getAndSetMethods( config_name, project_name, null);
				$( '.action' ).prop( 'disabled', true );
				$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
				getLogSocketIO( config_name, project_name ); 
			});
		}
	});

});



