"use strict";

oPub.updateProject = true;
//to change also in layout.html and layout.js
oPub.updateFolder = true;

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

function createZip() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();


	$.get( '/services/method/buildAndGetZip/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name, function( encZip ) {
		
		$( '#zipFile' ).attr( 'download', method_name + '.tar.gz' );
		$( '#zipFile' ).attr( 'href', 'data:application/zip; base64, ' + encZip );

		$( '#zipFile' ).append( '<img src="../img/archive.png" style="float:right" height="60"/>')

	}).fail(function( xhr ) {
		console.log( xhr.responseText );
	});

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

	$.get('/services/method/do/' 
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

function updateFileList( folder_name ) {
	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();

	if ( method_name !== '' ) {
		$.get( '/services/method/get/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ method_name + '/' 
			+ folder_name, function( srcList ) {

			$( '#src_files' ).empty();
			for ( var i in srcList ) {
				$( '#src_files' ).append($( '<option>' ).attr( 'value', srcList[i] ).text( srcList[i] ) );
			}
		});
	}
}

$(document).ready(function() {

	var config_name = oPub.selectedConn.name, 
		project_name = oPub.selectedConn.projectName,
		socketID = oPub.socketID;

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

		//unsubscribe
		unsubscribe( '' );
		count = 0;

		//clean wait image
		$( '#respWait' ).removeAttr( 'src' );

		$( '.action' ).prop( 'disabled', false );
		
		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );

		cleanMethodForm();

		//clean method type
		$( '#method_types' ).html( '<option value="">Choose A Method Type</option>' );

		updateConfigurationForm( getInstalledMethod );

	});

	//get method
	$("#methods").change( function() {
		//setTextAndScroll( 'resp_textarea', '' );

		$( '#src_files' ).empty();
		$( '#folders' ).val('src');
		updateMethodForm( );
	});

	$( '#folders' ).change( function() {
		updateFileList( $(this).val() );
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



