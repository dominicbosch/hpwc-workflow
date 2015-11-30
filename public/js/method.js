"use strict";

oPub.updateProject = true;
oPub.updateMethodInstalled = true;
//to change also in layout.html and layout.js
oPub.updateFolder = true;

function cleanMethodForm() {
	$( '#edit_method input[name="method_type"]' ).val( '' );
	$( '#src_files' ).empty();
	$( '#folders' ).val('src');
	$( '#edit_method textarea[name="comment"]' ).val( '' );
	//de-activate action related to a method
	$( '.action[name=method]' ).prop( 'disabled', true );
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
		});
	//activate action related to a method
	$( '.action[name=method]' ).prop( 'disabled', false );
}

function updateMethodForm( cb ) {
	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();

	if ( method_name === '' ) {
		cleanMethodForm();
	} else {
		$.get( '/services/method/get/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ method_name, function( method ) {

			setMethodForm( method );
		})
		.fail( function( xhr ) {
			cleanMethodForm();
			addTextAndScroll( 'info_textarea', xhr.responseText );
		});
	}
/*
	if (method_name === '') {
		cleanMethodForm();
	} else {
		$.get( '/services/method/get/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ method_name, function( method ) {
			setMethodForm( method );
		});
	}*/
}

function createZip() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val();


	$.get( '/services/method/buildAndGetZip/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name, function( encZip ) {

		if ( encZip !== '' ) {
			//remove old version
			//clean image
			$( '#zipFile' ).empty();
			$( '#zipFile' ).removeAttr( 'download' );
			$( '#zipFile' ).removeAttr( 'href' );

			//put new version
			$( '#zipFile' ).attr( 'download', method_name + '.tar.gz' );
			$( '#zipFile' ).attr( 'href', 'data:application/zip; base64, ' + encZip );

			$( '#zipFile' ).append( '<img src="../img/archive.png" style="float:right" height="60"/>');
			$( '#zipFile' ).append( '</br>');
			$( '#zipFile' ).append( '<label style="float:right" >' + method_name + '.tar.gz</label>' );
		}

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

			if ( typeof(cb) === 'function' ) 
				cb( );

		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	} else {
		//clean method list
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );
	}
}

function actionOnMethodSocketIO( action ) {

	var	config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		method_name = $( '#methods' ).val(),
		sched_type = $( '#sched_type' ).val(),
		sched_part = $( '#sched_part' ).val(),
		walltime = $( '#walltime' ).val(),
		memory = $( '#memory' ).val(),
		job_cmd = '', job;

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

	$( '.action[name=project]' ).prop( 'disabled', true );
	$( '.kill' ).prop( 'disabled', false );
	$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );

	if ( sched_type !== '' ) {
		if ( sched_part === '' ) {
			sched_part = 'smp';
		}
		if ( walltime === '' ) {
			walltime = '0';
		}
		if ( memory === '' ) {
			memory = '0';
		}
		job_cmd = '_job';
		job.sched_type = sched_type;
		job.sched_part = sched_part;
		job.walltime = walltime;
		job.memory = memory;
	}

	subscribe( config_name );

	$.post('/services/method/do'
		+ job_cmd + '/' 
		+ action + '/'
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name, job, function( data ) {

		var msg = data;

		if ( data === true ) {
			msg = 'Command Fired!\nThe output will be shown in the response area\n';
		} else {
			//unsubscribe
			unsubscribe( '' );
			count = 0;

			//clean wait image
			$( '#respWait' ).removeAttr( 'src' );
			$( '.action[name=project]' ).prop( 'disabled', false );
			$( '.kill' ).prop( 'disabled', true );
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

		setTextAndScroll( 'info_textarea', data );

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

function kill_process() {
	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val();

	if (confirm('Are you sure you want to kill the process?')) {
		killProcess( config_name, project_name );
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
			$( '#projWait' ).attr( 'src', '../img/ajax-loader.gif' );
			$( '#methods' ).prop( 'disabled', true );
			getAndSetMethods( config_name, project_name, function() {
				$( '#projWait' ).removeAttr( 'src' );
				$( '#methods' ).prop( 'disabled', false );
			});
			$( '.kill' ).prop( 'disabled', false );
			//set spinning image while checking for old process to be finished
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLogSocketIO( config_name, project_name ); 
		}
	);

	$( '#connectButton' ).on( 'click', function() {
		//set method and update
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );
		updateMethodForm();
		$( '#methods' ).prop( 'disabled', true );
	});

	$( '#configs' ).change( function() {

		//unsubscribe
		unsubscribe( '' );
		count = 0;

		//set method and update
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );
		updateMethodForm();
		$( '#methods' ).prop( 'disabled', true );
		
		updateConfigurationForm( getInstalledMethod );

	});

	//get method
	$("#methods").change( function() {
		//cleanMethodForm();
		updateMethodForm( );
	});

	$( '#folders' ).change( function() {
		updateFileList( $(this).val() );
	});

	//when the project selected change, we read the modules implemented
	$("#projects").change( function() {

		//$( '#projWait' ).attr( 'src', '../img/ajax-loader.gif' );
		//$(document.body).css({ 'cursor': 'wait' });
		//$(document.body).css({ 'cursor': 'default' })

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
		$( '.kill' ).prop( 'disabled', true );

		//clean response area
		setTextAndScroll( 'resp_textarea', '' );

		//set method and update
		$( '#methods' ).html( '<option value="">Choose A Method</option>' );
		updateMethodForm();

		if ( project_name === '' ) {
			$.get('/services/session/cleanProject', function( data ) {
				//de-activate action related to a project
				$( '.action[name=project]' ).prop( 'disabled', true );
			});
		} else {
			//activate action related to a project
		//	$( '.action[name=project]' ).prop( 'disabled', false );

			$( '#projWait' ).attr( 'src', '../img/ajax-loader.gif' );
			$( '#projects' ).prop( 'disabled', true );
			$( '#methods' ).prop( 'disabled', true );

			//fill project form
			$.get( '/services/project/get/' 
				+ config_name + '/' 
				+ project_name, function( project ) {

				getAndSetMethods( config_name, project_name, null, function() {
					//activate action related to a project
				//	$( '.action[name=project]' ).prop( 'disabled', false );

					$( '#projWait' ).removeAttr( 'src' );
					$( '#projects' ).prop( 'disabled', false );
					$( '#methods' ).prop( 'disabled', false );
				});
				$( '.action[name=project]' ).prop( 'disabled', true );
				$( '.kill' ).prop( 'disabled', false );
				//set spinning image while checking for old process to be finished
				$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
				getLogSocketIO( config_name, project_name );
			});
		}
	});

});
