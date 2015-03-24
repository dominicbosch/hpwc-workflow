"use strict";

oPub.updateProject = true;

//OK
function addToList( name ) {
	var string = '', 
		value = $( '#' + name ).val().trim();

	if ( value !== '' ) {
		if ( $( '#experiment_setup [name="' + name + '"] input[value="' 
			+ value + '"]' ).val() ) {
			alert("Value already in the list, just check it!");
		} else {
			string = createListItem( value, true, false );
			$( '#experiment_setup [name="' + name + '"]' ).append( string );
		}
	} else {
		alert( 'First select a value' );
	}
}

//OK
function cleanProjectForm() {
	$( '#experiment_setup [name="par_list"]' ).empty();
	$( '#experiment_setup [name="par_val"]' ).empty();
	$( '#experiment_setup [name="nthreads"] input' ).prop( 'checked', false );
	$( '#experiment_setup [name="hosts"]' ).empty();
}

//OK
function setProjectForm( project ) {
	$( '#experiment_setup [name="par_list"]' ).text(project.parameters.list);
	$( '#experiment_setup [name="par_val"]' ).html(
		createListItem( project.parameters.default, true, false ) );
	$( '#experiment_setup [name="nthreads"] input[value="' 
		+ project.threads + '"]' ).prop( 'checked', true );
	$( '#experiment_setup [name="hosts"]' ).html(
		createListItem( 'localhost', true, true ) );

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

			oPub.selectedConn.projectName = '';

			//clean information related to the project
			cleanProjectForm();

			//clean method list
			$("#experiment_setup [name='methods']").empty();

			//clean output list
			$("#experiments").html("<option value=''>Choose An Experiment</option>");

		});
	} else {
		//fill project form
		$.get( '/services/project/get/' 
			+ config_name + '/' 
			+ project_name, function( project ) {

			oPub.selectedConn.projectName = project_name;

			setProjectForm( project );

			//update methods list
			getAndSetMethodsList( config_name, project_name );

			//update experiment list
			getAndSetExperiments( config_name, project_name );

			if ( typeof(cb) === 'function' ) 
				cb();
		});
	}
}

//OK
function getAndSetMethodsList( config_name, project_val ) {

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

		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	} else {
		//clean method list
		$("#experiment_setup [name='methods']").empty();
	}
}

function runExp( ) {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment;

	if ( config_name === '' ) {
		alert( 'Select A Configuration' );
		return;
	}

	if ( project_name === '' ) {
		alert( 'Select A Project' );
		return;
	}

	$( '.action' ).prop( 'disabled', true );

	$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );

	subscribe( config_name );

	experiment = {
		dimensions : buildList( 'experiment_setup', 'par_val' ),
		methods : buildList( 'experiment_setup', 'methods' ),
		nthreads : buildList( 'experiment_setup', 'nthreads' ),
		nexecs : '5'
	}

	$.post( '/services/experiment/run/' 
		+ config_name + '/' 
		+ project_name, experiment, function( data ) {

		var msg = data;
		
		if ( data === true ) {
			msg = 'Experiment Started!\nThe output will be shown in the respose area';
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

$(document).ready(function() {

	var config_name = oPub.selectedConn.name, 
		project_name = oPub.selectedConn.projectName,
		socketID = oPub.socketID;

	connectToSocket( socketID );

	//OK
	updateConfigurationsList( 
		null,
		function() {
			updateProjectFormInExp();
			$( '.action' ).prop( 'disabled', true );
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
		$("#experiments").html("<option value=''>Choose An Experiment</option>");
	});

	//OK
	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );

		//clean information related to the project
		if ( oPub.selectedConn.projectName && ( oPub.selectedConn.projectName !== '' ) )
			updateProjectFormInExp();

		//update the right part of the page and read the project list
		updateConfigurationForm();

		//unsubscribe
		unsubscribe( '' );
		count = 0;

		//clean wait image
		$( '#respWait' ).removeAttr( 'src' );

		$( '.action' ).prop( 'disabled', false );
	});

	//get data
	$("#experiments").change( function() {

		//updateOutputForm( );
	});

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

		$( '.action' ).prop( 'disabled', false );

		//clean response area
		setTextAndScroll( 'resp_textarea', '' );

		//clean output list
		$("#experiments").html("<option value=''>Choose An Experiment</option>");

		updateProjectFormInExp( function(){
			$( '.action' ).prop( 'disabled', true );
			$( '#respWait' ).attr( 'src', '../img/ajax-loader.gif' );
			getLogSocketIO( config_name, project_name ); 
		});
	});
});
