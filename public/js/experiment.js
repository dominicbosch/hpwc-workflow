"use strict";

oPub.updateProject = true;

//OK
function addToList( name, ordered ) {
	var string = '', inserted = false,
		value = $( '#' + name ).val().trim();

	if ( value !== '' ) {
		if ( $( '#experiment_setup [name="' + name + '"] input[value="' 
			+ value + '"]' ).val() ) {
			alert("Value already in the list, just check it!");
		} else {
			string = createListItem( value, true, false );
			if ( ordered ) {
				$( '#experiment_setup [name="' + name + '"] input' ).each( function() {
					//if the new value is less than the one in the list then insert it!
					if ( parseInt(value) < parseInt($(this).val()) ) {
						$(string).insertBefore($(this).parent());
						//set inserted to true
						inserted = true;
						//exit the "each" loop
						return false;
					}
				});
			}
			//if not inserted put at the end
			if ( !inserted) {
				$( '#experiment_setup [name="' + name + '"]' ).append( string );
			}
		}
	} else {
		alert( 'First select a value' );
	}
}

//OK
function editAll( tag, name, val ) {

	$( tag + '[name="' + name + '"] input' ).prop( 'checked', val );

}

//OK
function cleanProjectForm() {
	$( '#experiment_setup [name="par_list"]' ).empty();
	$( '#experiment_setup [name="par_val"]' ).empty();
	$( '#experiment_setup [name="nthreads"] input' ).prop( 'checked', false );
	//$( '#experiment_setup [name="hosts"]' ).empty();
}

//OK
function setProjectForm( project ) {
	$( '#experiment_setup [name="par_list"]' ).text(project.parameters.list);
	$( '#experiment_setup [name="par_val"]' ).html(
		createListItem( project.parameters.default, true, false ) );
	$( '#experiment_setup [name="nthreads"] input[value="' 
		+ project.threads + '"]' ).prop( 'checked', true );
	//$( '#experiment_setup [name="hosts"]' ).html(
	//	createListItem( 'localhost', true, true ) );

}

function cleanOutputForm() {
	$( '.fixed' ).prop( 'checked', true );
	$( '.fixed' ).prop( 'disabled', true );
	$( '#exp_details [name="parameters"]' ).text( '--' );
	$( '#exp_details [name="methods"]' ).text( '--' );
	$( '#exp_details [name="nthreads"]' ).text( '--' );
	$( '#exp_details [name="nexecs"]' ).text( '--' );
}

//OK
function updateProjectFormInExp( cb ) {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val();

	if ( project_name === '' ) {
		$.get( '/services/session/cleanProject', function( data ) {


//			oPub.selectedConn.projectName = ''; //maybe not needed

			//clean information related to the project
			cleanProjectForm();

			//clean method list
			$("#experiment_setup [name='methods']").empty();

			//clean output list
			//$("#experiments").html("<option value=''>Choose An Experiment</option>");

		});
/*		}).fail( function( xhr ) {
			setTextAndScroll( 'info_textarea', xhr.responseText );
		});*/
	} else {
		//fill project form
		/*$.get( '/services/project/get/' 
			+ config_name + '/' 
			+ project_name, function( project ) {

		//	oPub.selectedConn.projectName = project_name; //maybe not needed

			setProjectForm( project );

			//update methods list
			getAndSetMethodsList( config_name, project_name, function() {
				if ( typeof(cb) === 'function' ) 
					cb();
			});

			//update experiment list
			//getAndSetExperiments( config_name, project_name );
		});*/
		$.get( '/services/project/get/' 
			+ config_name + '/' + project_name
		).done( function( data ) {

			var project = data;

			setProjectForm( project );

			//update methods list
			getAndSetMethodsList( config_name, project_name, function() {
				if ( typeof(cb) === 'function' ) 
					cb();
			});

			//update experiment list
			//getAndSetExperiments( config_name, project_name );
		}).fail( function( xhr ) {
			
			cleanProjectForm();
			//clean method list
			$("#experiment_setup [name='methods']").empty();

			setTextAndScroll( 'info_textarea', xhr.responseText );
		});
	}
}

//OK
function getAndSetMethodsList( config_name, project_val, cb ) {

	if( ( config_name !== '' ) && ( project_val !== '' ) ) {
		//read the projects for an open connection and set the values
		$.get( '/services/method/getAll/' 
			+ config_name + '/'
			+ project_val, function( methods ) {

			var string_html = '';

			//fill list
			for ( var i in methods ) {
				string_html += createListItem( methods[i], false, false );
			}
			$("#experiment_setup [name='methods']").html(string_html);

			if ( typeof(cb) === 'function' ) 
				cb();

		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	} else {
		//clean method list
		$("#experiment_setup [name='methods']").empty();
		if ( typeof(cb) === 'function' ) 
			cb();
	}
}

function runExp( ) {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		nexec = $( '#repetitions' ).val(),
		sched_type = $( '#sched_type' ).val(),
		sched_part = $( '#sched_part' ).val(),
		walltime = $( '#walltime' ).val(),
		memory = $( '#memory' ).val(),
		dimensions, methods, nthreads,
		job_cmd = '', experiment;

	if ( config_name === '' ) {
		alert( 'Select A Configuration' );
		return;
	}

	if ( project_name === '' ) {
		alert( 'Select A Project' );
		return;
	}

	if ( ( nexec === '' ) || ( nexec <= 0 ) ) {
		nexec = 5;
	}

	dimensions = buildList( 'experiment_setup', 'par_val' );
	if ( dimensions === '' ) {
		alert( 'Select at least one parameter' );
		return;
	}

	methods = buildList( 'experiment_setup', 'methods' );
	if ( methods === '' ) {
		alert( 'Select at least one method' );
		return;
	}
	nthreads = buildList( 'experiment_setup', 'nthreads' );
	if ( nthreads === '' ) {
		alert( 'Select at least one "nthread"' );
		return; 
	}

	$( '.action[name=run]' ).prop( 'disabled', true );
	$( '.kill' ).prop( 'disabled', false );
	$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );

	experiment = {
		dimensions : dimensions,
		methods : methods,
		nthreads : nthreads,
		nexecs : nexec
	}

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
		experiment.sched_type = sched_type;
		experiment.sched_part = sched_part;
		experiment.nodes = getMax( 'experiment_setup', 'nthreads' );
		experiment.walltime = walltime;
		experiment.memory = memory;
	}

	subscribe( config_name );

	$.post( '/services/experiment/run'
		+ job_cmd + '/' 
		+ config_name + '/' 
		+ project_name, experiment, function( data ) {

		var msg = data;
		
		if ( data === true ) {
			msg = 'Experiment Started!\nThe output will be shown in the response area\n';
		} else {
			//unsubscribe
			unsubscribe( '' );
			count = 0;

			//clean wait image
			$( '#respWait' ).removeAttr( 'src' );
			$( '.action[name=run]' ).prop( 'disabled', false );
			$( '.kill' ).prop( 'disabled', true );
		}

		addTextAndScroll( 'info_textarea', msg );

	}).fail(function( xhr ) {
		console.log( xhr.responseText );
	});

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

	//OK
	updateConfigurationsList( 
		null,
		function() {
/* Done by default on loading of page (in layout.js)
			$( '.action[name=run]' ).prop( 'disabled', true );
*/
/*			updateProjectFormInExp( function() {
				//set right before looking for a pending process
				$( '.kill' ).prop( 'disabled', false );
				//set spinning image while checking for old process to be finished
				$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
				getLogSocketIO( config_name, project_name );
			});*/
			updateProjectFormInExp();
			//start getting the log related to the project while updating it
			//set right before looking for a pending process
			$( '.kill' ).prop( 'disabled', false );
			//set spinning image while checking for old process to be finished
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLogSocketIO( config_name, project_name );
		}
	);

	$( '#connectButton' ).on( 'click', function() {

		//when disconnect, the project has to be deleted but this doesn't influence the functioning
		//oPub.selectedConn.projectName = '';

		//clean information related to the project
		cleanProjectForm();

		//clean method list
		$("#experiment_setup [name='methods']").empty();

		//clean output list
		//$("#experiments").html("<option value=''>Choose An Experiment</option>");
	});

	//OK
	//create handler for changing of configuraton
	$("#configs").change( function() {

		//unsubscribe
		unsubscribe( '' );
		count = 0;

		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );

		//clean information related to the project
		if ( oPub.selectedConn.projectName && ( oPub.selectedConn.projectName !== '' ) )
			updateProjectFormInExp();

		//update the right part of the page and read the project list
		updateConfigurationForm();
	});

	//get data

/* experiments list is not anymore in this page, we leave this for future
	$("#experiments").change( function() {
		updateOutputForm( );
	});
*/

	//when the project selected change, we read the value of parameters (user change)
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
		$( '.action[name=project]' ).prop( 'disabled', true );
		$( '.kill' ).prop( 'disabled', true );

		//clean response area
		setTextAndScroll( 'resp_textarea', '' );

		//clean output list
		//$("#experiments").html("<option value=''>Choose An Experiment</option>");

//		$( '.action[name=project]' ).prop( 'disabled', true );
//		updateProjectFormInExp( function() {
			//set right before looking for a pending process
//			$( '.kill' ).prop( 'disabled', false );
//			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
//			getLogSocketIO( config_name, project_name );

		updateProjectFormInExp( function() {
			//set right before looking for a pending process
			$( '.kill' ).prop( 'disabled', false );
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLogSocketIO( config_name, project_name ); 
		});
	});
});
