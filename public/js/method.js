"use strict";

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
	$( '#edit_method textarea[name="comment"]' ).val( method.comment );
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

function getAndSetMethods( config_name, project_val, method_val, cb ) {

	if( config_name !== '' ) {
		//read the projects for an open connection and set the values
		$.get( '/services/method/getAll/' 
			+ config_name + '/'
			+ project_val, function( methods ) {

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

function getInstalledMethod( config_name ) {

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

		$("#resp_textarea").val( data );
		
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

function updateConfigListInMethod( cb ) {

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

				if( oPub.selectedConn.status ) {
					//retrieve project list if old connection is set and connected
					var config_name = oPub.selectedConn.name, 
						project_val = oPub.selectedConn.projectName;

					$.get( '/services/project/getAll/' + config_name, function( projects ) {

						for ( var i in projects ) {
							$( '#projects' ).append($( '<option>' ).attr( 'value', projects[i] ).text( projects[i] ) );
						}

						if (project_val) {
							$( '#projects' ).val( project_val );
							getAndSetMethods( config_name, project_val );
						}
					}).fail(function( xhr ) {
						console.log( xhr.responseText );
					});

					getInstalledMethod( config_name );
				}
			}
		}
	});
}

$(document).ready(function() {

	$( '#connectButton' ).on( 'click', cleanMethodForm );

	updateConfigListInMethod();

	$( '#configs' ).change( function() {

		var config_name = $( '#configs' ).val();

		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );

		cleanMethodForm();

		//clean method type
		$( '#method_types' ).html( '<option value="">Choose A Method Type</option>' );

		updateConfigurationForm( getInstalledMethod );

	});

	//get method
	$("#methods").change( function() {
		$( '#resp_textarea' ).val( '' );
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

			});
		}
	});

});



